const fs = require('fs-extra');
const path = require('path');

/**
 * Parse an Apex class to extract properties, methods, getters/setters, annotations, and doc comments.
 * Extracts structured Javadoc/ApexDoc comments.
 * @param {string} classFilePath
 * @returns {Promise<{name: string, properties: object[], methods: object[], rawContent: string}>}
 */
async function parseApexClass(classFilePath) {
    const content = await fs.readFile(classFilePath, 'utf-8');
    const className = path.basename(classFilePath, '.cls');

    const properties = [];
    const methods = [];

    // Matches doc comments (/** ... */) preceding a member
    const docCommentBlockRegex = /\/\*\*([\s\S]*?)\*\//g;
    const annotationRegex = /@([a-zA-Z0-9_]+)/g;

    // Matches class members (methods and properties)
    const memberRegex = /(public|global|private|protected)\s+(static\s+|final\s+|virtual\s+|override\s+|abstract\s+)?([\w<>\[\]]+)\s+(\w+)\s*(\([^\)]*\))?\s*(\{[\s\S]*?\}|;)/g;

    let match;
    let lastIndex = 0;

    while ((match = memberRegex.exec(content)) !== null) {
        const beforeMember = content.slice(lastIndex, match.index);
        lastIndex = memberRegex.lastIndex;

        // Extract doc comment block immediately before the member
        const docMatch = beforeMember.match(docCommentBlockRegex);
        let docCommentRaw = docMatch ? docMatch[docMatch.length - 1] : '';
        let description = 'No documentation provided.';
        const params = [];
        let returns = 'void';

        if (docCommentRaw) {
            // Clean up doc comment lines and parse tags
            let cleanedDoc = docCommentRaw.replace(/^\s*\* ?/gm, '').replace(/\/\*\*|\*\//g, '').trim();

            const paramRegex = /@param\s+(\w+)\s+([\s\S]*?)(?=@param|@return|\*\/|\n\s*\n|$)/g;
            const returnRegex = /@return\s+([\s\S]*?)(?=@param|\*\/|\n\s*\n|$)/;
            const descriptionRegex = /^([\s\S]*?)(?=@param|@return|\*\/|\n\s*\n|$)/;

            // Extract parameters
            let paramMatch;
            while ((paramMatch = paramRegex.exec(cleanedDoc)) !== null) {
                params.push({ name: paramMatch[1], description: paramMatch[2].trim() });
            }

            // Extract return value
            const returnMatch = returnRegex.exec(cleanedDoc);
            if (returnMatch) {
                returns = returnMatch[1].trim();
            }

            // Extract main description (what's left before any tags or until first blank line after tags)
            const descriptionMatch = cleanedDoc.match(descriptionRegex);
            if (descriptionMatch && descriptionMatch[1].trim()) {
                description = descriptionMatch[1].trim();
            }
        }


        // Extract annotations immediately before the member
        const annotations = [];
        let annotationMatch;
        const tempAnnotationRegex = /@([a-zA-Z0-9_]+)(\s*\([^\)]*\))?/g; // Capture annotations with their potential arguments
        while ((annotationMatch = tempAnnotationRegex.exec(beforeMember)) !== null) {
            annotations.push(annotationMatch[0].trim()); // Store the full annotation
        }

        const visibility = match[1];
        const modifiers = match[2] ? match[2].trim().split(/\s+/) : [];
        const type = match[3].trim();
        const name = match[4].trim();
        const parametersString = match[5];
        const bodyOrSemicolon = match[6];

        if (parametersString) {
            // Method
            methods.push({
                name,
                type,
                visibility,
                modifiers,
                parameters: parametersString.slice(1, -1).trim(),
                description: description,
                params: params,
                returns: returns,
                annotations
            });
        } else {
            
            properties.push({
                name,
                type,
                visibility,
                modifiers,
                description: description, // Main description from Javadoc
                annotations
            });
        }
    }

    return {
        name: className,
        properties,
        methods,
        rawContent: content
    };
}

module.exports = { parseApexClass };