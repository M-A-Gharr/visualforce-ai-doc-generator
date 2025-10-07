const fs = require('fs-extra');
const path = require('path');

async function writeMarkdown(outputDir, pageName, content){
  await fs.ensureDir(outputDir);
  const filePath = path.join(outputDir, `${pageName}.md`);
  await fs.writeFile(filePath, content);
  return filePath;
}

module.exports = { writeMarkdown };