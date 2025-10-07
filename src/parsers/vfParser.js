const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const xml2js = require('xml2js');

async function parsePageMeta(pageFilePath) {
  const metaFilePath = `${pageFilePath}-meta.xml`;
  if (await fs.pathExists(metaFilePath)) {
    const xml = await fs.readFile(metaFilePath, 'utf-8');
    const parsed = await xml2js.parseStringPromise(xml);
    const page = parsed.ApexPage || {};
    return {
      apiVersion: page.apiVersion ? page.apiVersion[0] : '',
      controller: page.controller ? page.controller[0] : '',
      extension: page.extension ? page.extension[0] : '',
      label: page.label ? page.label[0] : ''
    };
  }
  return {};
}

async function parseVisualforcePage(pageFilePath) {
  const content = await fs.readFile(pageFilePath, 'utf-8');
  const $ = cheerio.load(content, { xmlMode: true });
  const pageName = path.basename(pageFilePath, '.page');
  const meta = await parsePageMeta(pageFilePath);

  // ---- Detect controllers and extensions directly from <apex:page> ----
  // Prioritize attributes from the <apex:page> tag over the meta.xml file
  const pageTag = $('apex\\:page');
  const standardController = pageTag.attr('standardController') || meta.controller || null;
  const customController = pageTag.attr('controller') || null;

  let extensionsArray = [];
  const extensionsAttr = pageTag.attr('extensions');
  if (extensionsAttr) {
    // Extensions can be a comma-separated list
    extensionsArray = extensionsAttr.split(',').map(ext => ext.trim()).filter(ext => ext.length > 0);
  } else if (meta.extension) {
    extensionsArray.push(meta.extension);
  }

  // ---- Page Blocks & Sections ----
  const pageBlocks = [];
  $('apex\\:pageBlock').each((i, pb) => {
    const title = $(pb).attr('title') || $(pb).find('apex\\:facet[name="header"]').text().trim() || 'Untitled PageBlock';
    const sections = [];
    $(pb).find('apex\\:pageBlockSection').each((j, sec) => {
      const sectionTitle = $(sec).attr('title') || $(sec).find('apex\\:facet[name="header"]').text().trim() || 'Untitled Section';
      const items = [];

      // Extract items: pageBlockSectionItem + outputField + outputText + inputField etc.
      $(sec)
        .find('apex\\:pageBlockSectionItem, apex\\:outputField, apex\\:outputText, apex\\:inputField, apex\\:inputText, apex\\:inputTextArea, apex\\:selectList, apex\\:inputCheckbox, apex\\:inputHidden, apex\\:outputPanel')
        .each((k, item) => {
          const itemText = $(item).text().trim();
          const itemValue = $(item).attr('value');
          const itemLabel = $(item).attr('label');
          const itemId = $(item).attr('id');

          let itemDescription = '';
          if (itemLabel) itemDescription += `Label: ${itemLabel}`;
          if (itemValue && itemValue !== itemLabel) itemDescription += (itemDescription ? ', ' : '') + `Value: ${itemValue}`;
          if (itemId) itemDescription += (itemDescription ? ', ' : '') + `ID: ${itemId}`;
          if (itemText && itemText.length < 50 && !itemValue && !itemLabel) itemDescription = itemText;

          if (itemDescription) items.push(itemDescription);
        });

      sections.push({ title: sectionTitle, items });
    });
    pageBlocks.push({ title, sections });
  });

  // ---- Forms, Inputs, Buttons ----
  const forms = [];
  const inputs = [];
  const buttons = [];

  $('apex\\:form').each(() => forms.push(true));

  const inputTags = [
    'inputField', 'inputText', 'inputTextArea', 'selectList', 'inputCheckbox', 'inputHidden'
  ];
  inputTags.forEach(tag => {
    $(`apex\\:${tag}`).each((i, el) => {
      const value = $(el).attr('value');
      if (value) inputs.push(value);
    });
  });

  const buttonTags = ['commandButton', 'button', 'commandLink'];
  buttonTags.forEach(tag => {
    $(`apex\\:${tag}`).each((i, el) => {
      const action = $(el).attr('action') || $(el).attr('onclick') || $(el).attr('value') || $(el).text();
      if (action) buttons.push(action);
    });
  });

  // ---- Detect actionSupport elements ----
  const actionSupports = [];
  $('apex\\:actionSupport').each((i, as) => {
    const event = $(as).attr('event');
    const reRender = $(as).attr('reRender');
    const action = $(as).attr('action');
    const status = $(as).attr('status');

    const parentTag = $(as).parent().get(0) ? $(as).parent().get(0).tagName : 'N/A';
    const parentId = $(as).parent().attr('id') || 'N/A';

    actionSupports.push({
      event: event || 'N/A',
      reRender: reRender || 'N/A',
      action: action || 'None',
      status: status || 'None',
      parent: parentTag,
      parentId: parentId
    });
  });

  // ---- OutputPanels Detection ----
  const outputPanels = [];
  $('apex\\:outputPanel').each((i, op) => {
    const id = $(op).attr('id');
    const layout = $(op).attr('layout');
    const content = $(op).text().trim().substring(0, 100) + ($(op).text().trim().length > 100 ? '...' : '');

    if (id) {
      outputPanels.push({
        id: id,
        layout: layout || 'default (div)',
        contentPreview: content || 'Empty'
      });
    }
  });

  // ---- Detect scripts ----
  const scripts = [];
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    const content = $(el).html().trim();
    if (src) {
      scripts.push({ type: 'external', value: src });
    } else if (content) {
      // For inline scripts, don’t include all the content for the AI, just add a note
      scripts.push({ type: 'inline', value: 'Contains inline JavaScript' });
    }
  });
  $('apex\\:includeScript').each((i, el) => {
    const value = $(el).attr('value');
    if (value) scripts.push({ type: 'apex:includeScript', value: value });
  });


  // ---- Bindings & Dependencies ----
  const bindings = [];
  const dependencyObjects = new Set();
  const dependencyFields = new Set();
  const dependencyComponents = new Set();
  const dependencyStaticResources = new Set();

  const bindingRegex = /\{!([^}]+)\}/g;
  let match;
  while ((match = bindingRegex.exec(content)) !== null) {
    const val = match[1].trim();
    bindings.push(val);
    if (val.includes('.')) {
      dependencyObjects.add(val.split('.')[0].trim());
      dependencyFields.add(val.trim());
    } else {
      dependencyFields.add(val.trim());
    }
  }

  // Custom components
  const componentRegex = /<c:([a-zA-Z0-9_]+)/g;
  while ((match = componentRegex.exec(content)) !== null) {
    dependencyComponents.add(match[1]);
  }

  // Static resources
  const resourceRegex = /\$Resource\.([a-zA-Z0-9_]+)/g;
  while ((match = resourceRegex.exec(content)) !== null) {
    dependencyStaticResources.add(match[1]);
  }

  return {
    name: pageName,
    pageMeta: meta,
    standardController: standardController,
    customController: customController,
    extensions: extensionsArray,
    recordSetVar: pageTag.attr('recordSetVar') || null,
    pageStructure: { forms: forms.length, inputs, buttons, pageBlocks },
    scripts: scripts,
    actionSupports: actionSupports,
    outputPanels: outputPanels,
    bindings,
    dependencies: {
      objects: [...dependencyObjects],
      fields: [...dependencyFields],
      components: [...dependencyComponents],
      staticResources: [...dependencyStaticResources]
    }
  };
}

module.exports = { parseVisualforcePage };