require('dotenv').config();
const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OpenAI API key not found in environment variables. AI overview will not work.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate AI-based documentation fields for a Visualforce page,
 * including overview, purpose, and detailed descriptions for associated Apex properties and methods.
 * @param {string} pageName - Name of the Visualforce page
 * @param {object} pageData - Parsed page data (bindings, inputs, pageBlocks, dependencies, scripts, controllers)
 * @param {object[]} apexProperties - Array of parsed Apex properties
 * @param {object[]} apexMethods - Array of parsed Apex methods
 * @returns {Promise<{overview:string, purpose:string, keyFunctions:string[], pageBlocks:object[], dependencies:object, properties:object[], methods:object[]}>}
 */
async function generatePageAndApexOverview(pageName, pageData, apexProperties = [], apexMethods = []) {
    if (!openai.apiKey) {
        console.warn("OpenAI API key missing. Skipping AI generation.");
        return {
            overview: "AI overview not available (API key missing).",
            purpose: "AI purpose not available (API key missing).",
            keyFunctions: [],
            pageBlocks: [],
            dependencies: pageData.dependencies,
            properties: apexProperties.map(p => ({ ...p, descriptionAI: p.description || 'AI description not available (API key missing).' })),
            methods: apexMethods.map(m => ({ ...m, descriptionAI: m.description || 'AI description not available (API key missing).' }))
        };
    }

    try {
        const prompt = `
You are an expert Salesforce developer, specializing in Visualforce and Apex.
Analyze the provided Visualforce page data and its associated Apex controller/extension members.
Return a single JSON object with the following fields:

- "overview": A concise summary (2-3 sentences) of what this Visualforce page does, its main components, and typical user interaction. Pay attention to AJAX interactions via apex:actionSupport if present.
- "purpose": A clear explanation (1-2 sentences) of why this page exists and the primary business problem it solves.
- "keyFunctions": A list of 3-5 bullet points describing the main functionalities or significant elements of the page (e.g., "Allows data entry for new records", "Displays a list of related contacts", "Handles form submission for record updates", "Implements AJAX updates for dynamic content using output panels").
- "pageBlocks": A refined list of pageBlock titles and section titles, focusing on their main role if possible (e.g., "Account Details: Basic information", "Related Contacts: List of associated contacts").
- "dependencies": An object listing Salesforce SObjects, fields, custom components, and static resources used.
- "properties": An array of Apex property objects. For each property, generate a concise, single-sentence "descriptionAI" field. Prioritize clarity and purpose.
- "methods": An array of Apex method objects. For each method, generate a concise, single-sentence "descriptionAI" field. Focus on its action, purpose, and what it returns or affects.

Ensure the "descriptionAI" for properties and methods is distinct from any "description" (Javadoc) already present. If no Javadoc is present, use the AI to infer a description.

Visualforce Page Name: "${pageName}"

Visualforce Page Data:
\`\`\`json
${JSON.stringify(pageData, null, 2)}
\`\`\`

Associated Apex Properties (for AI description generation):
\`\`\`json
${JSON.stringify(apexProperties.map(p => ({ name: p.name, type: p.type, visibility: p.visibility, docComment: p.description })), null, 2)}
\`\`\`

Associated Apex Methods (for AI description generation):
\`\`\`json
${JSON.stringify(apexMethods.map(m => ({ name: m.name, type: m.type, visibility: m.visibility, parameters: m.parameters, docComment: m.description })), null, 2)}
\`\`\`

Return a valid JSON object only, enclosed within \`\`\`json and \`\`\` markers.
`;

        const res = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        let text = res.choices[0].message.content.trim();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let aiResult;
        try {
            aiResult = JSON.parse(text);
        } catch (jsonErr) {
            console.error("Failed to parse AI response as strict JSON:", jsonErr.message);
            console.error("Raw AI response:", text);
            // Fallback to simpler extraction if strict JSON fails (less robust)
            aiResult = {
                overview: (text.match(/"overview":\s*"(.*?)"/s) || ["", "No overview generated"])[1],
                purpose: (text.match(/"purpose":\s*"(.*?)"/s) || ["", "No purpose found"])[1],
                keyFunctions: [],
                pageBlocks: [],
                dependencies: pageData.dependencies,
                properties: apexProperties.map(p => ({ ...p, descriptionAI: p.description || 'AI description generation failed.' })),
                methods: apexMethods.map(m => ({ ...m, descriptionAI: m.description || 'AI description generation failed.' }))
            };
        }

        // Merge AI-generated descriptions back into the original apexProperties/methods
        const finalProperties = apexProperties.map(p => {
            const aiDesc = aiResult.properties?.find(ap => ap.name === p.name)?.descriptionAI;
            return { ...p, descriptionAI: aiDesc || p.description || 'No AI description generated.' };
        });
        const finalMethods = apexMethods.map(m => {
            const aiDesc = aiResult.methods?.find(am => am.name === m.name)?.descriptionAI;
            return { ...m, descriptionAI: aiDesc || m.description || 'No AI description generated.' };
        });


        return {
            overview: aiResult.overview || "No overview generated.",
            purpose: aiResult.purpose || "No purpose found.",
            keyFunctions: aiResult.keyFunctions || [],
            pageBlocks: aiResult.pageBlocks || [],
            dependencies: aiResult.dependencies || pageData.dependencies,
            properties: finalProperties,
            methods: finalMethods
        };

    } catch (err) {
        console.error(`AI generation failed for ${pageName}:`, err.message);
        return {
            overview: "AI generation failed for this page.",
            purpose: "AI generation failed for this page.",
            keyFunctions: [],
            pageBlocks: [],
            dependencies: pageData.dependencies,
            properties: apexProperties.map(p => ({ ...p, descriptionAI: p.description || 'AI generation failed.' })),
            methods: apexMethods.map(m => ({ ...m, descriptionAI: m.description || 'AI generation failed.' }))
        };
    }
}

module.exports = { generatePageAndApexOverview };