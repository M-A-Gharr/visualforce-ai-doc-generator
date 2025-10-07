const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const { parseVisualforcePage } = require('./src/parsers/vfParser');
const { parseApexClass } = require('./src/parsers/apexParser');
const { generatePageAndApexOverview } = require('./src/ai/aiprovider');
const { writeMarkdown } = require('./src/utils/fileUtils');

Handlebars.registerHelper('join', function(array, separator) {
  if (!Array.isArray(array)) {
    return '';
  }
  return array.join(separator);
});

async function generateDocs(pagesDir, apexClassesDir, outputDir) {
  await fs.ensureDir(outputDir);

  // Load Handlebars template
  const templatePath = path.join(__dirname, 'src', 'templates', 'visualforce-page.hbs');
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);

  const pageFiles = await fs.readdir(pagesDir);
  for (const file of pageFiles) {
    if (!file.endsWith('.page')) continue;

    const pagePath = path.join(pagesDir, file);
    console.log(`Processing page: ${file}`);

    try {
      const parsedPage = await parseVisualforcePage(pagePath);
      let apexProperties = [];
      let apexMethods = [];
      const controllersToParse = [];

      // Add customController if present
      if (parsedPage.customController) {
          controllersToParse.push(parsedPage.customController);
      }
      // Add standardController if present and not already covered by customController
      if (parsedPage.standardController && parsedPage.standardController !== parsedPage.customController) {
          controllersToParse.push(parsedPage.standardController);
      }
      // Add extensions
      controllersToParse.push(...parsedPage.extensions);

      // Parse all detected Apex classes
      for (const controllerName of [...new Set(controllersToParse)]) { // Use Set to avoid duplicates
          const apexClassPath = path.join(apexClassesDir, `${controllerName}.cls`);
          if (await fs.pathExists(apexClassPath)) {
              console.log(`  Found and parsing Apex Class: ${controllerName}`);
              const parsedApex = await parseApexClass(apexClassPath);
              apexProperties.push(...parsedApex.properties);
              apexMethods.push(...parsedApex.methods);
          } else {
              console.warn(`  Apex Class not found for ${controllerName} at ${apexClassPath}`);
          }
      }

      // Generate AI overview, purpose, and member descriptions in a single call
      const aiGeneratedData = await generatePageAndApexOverview(
        parsedPage.name,
        parsedPage,
        apexProperties,
        apexMethods
      );

      // Prepare data for Handlebars
      const templateData = {
        pageName: parsedPage.name,
        // AI-generated data
        overview: aiGeneratedData.overview,
        purpose: aiGeneratedData.purpose,
        keyFunctions: aiGeneratedData.keyFunctions,
        pageBlocksAI: aiGeneratedData.pageBlocks,
        properties: aiGeneratedData.properties,
        methods: aiGeneratedData.methods,

        // Parsed data
        pageMeta: parsedPage.pageMeta || {},
        standardController: parsedPage.standardController,
        customController: parsedPage.customController,
        extensions: parsedPage.extensions,
        recordSetVar: parsedPage.recordSetVar,
        pageStructure: parsedPage.pageStructure,
        scripts: parsedPage.scripts,
        actionSupports: parsedPage.actionSupports,
        outputPanels: parsedPage.outputPanels,
        bindings: parsedPage.bindings,
        dependencies: aiGeneratedData.dependencies
      };

      // Render template
      const mdContent = template(templateData);

      // Write output
      const outFile = path.join(outputDir, `${parsedPage.name}.md`);
      await writeMarkdown(outputDir, parsedPage.name, mdContent);
      console.log(`Generated documentation: ${outFile}`);
    } catch (err) {
      console.error(`Failed to generate docs for ${file}:`, err.message);
    }
  }
}

// Example usage
const pagesDir = path.join(__dirname, 'visualforce-demo', 'src', 'pages');
const apexClassesDir = path.join(__dirname, 'visualforce-demo', 'src', 'classes');
const outputDir = path.join(__dirname, 'docs', 'visualforce');

generateDocs(pagesDir, apexClassesDir, outputDir);