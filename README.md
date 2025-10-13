# Visualforce AI Documentation Generator

> **_Turn your Salesforce Visualforce code into instant, AI-powered documentation._**

A powerful **Node.js-based tool** that automatically generates clean, Markdown-formatted documentation for Salesforce **Visualforce pages** and **Apex** controllers.

Perfect for **Salesforce developers**, **consultants**, and **companies maintaining legacy Visualforce systems** who want to save time, improve maintainability, and modernize their codebase.

## 🚀 Features & Benefits
- Extracts Visualforce components such as `apex:page`, `apex:form`, `apex:inputField`, and `apex:commandButton`
- Detects controllers, extensions, and `recordSetVar` references
- Parses Apex classes for methods and properties
- ⚡ Enhanced extraction of `apex:pageBlock`, `apex:pageBlockSection`, and `apex:pageBlockSectionItem`
- Generates clean, developer-friendly Markdown files using **Handlebars templates**
- Instantly generate accurate Visualforce documentation
- Improve project maintainability and team collaboration
- Keep your documentation always in sync with your Apex code
- 💡**Help older companies with legacy Visualforce code understand, maintain, and modernize their Salesforce projects faster**

## 🧩 Why Use This Tool?
If you’re a **Salesforce developer or consultant**, this tool helps you:
- Instantly generate accurate Visualforce documentation
- Improve project maintainability and team collaboration
- Keep your documentation always in sync with your Apex code

## 🛠️ Installation
```bash
git clone https://github.com/M-A-Gharr/visualforce-doc-generator.git
cd visualforce-doc-generator
npm install
```

## ▶️ Usage

Before running the project, you need to set up your environment and add your own Visualforce pages and Apex classes.

1. Add Your Visualforce and Apex Files

After installing dependencies, place your own files inside the demo project:

- Place your Visualforce pages inside:
    visualforce-demo/src/pages

- Place your Apex controller classes inside:
    visualforce-demo/src/classes

Example folder structure:
```bash
visualforce-doc-generator/
├── visualforce-demo/
│   ├── src/
│      ├── pages/
│      │   ├── MyPage.page
│      └── classes/
│          ├── MyController.cls
│ 
├── ...
├── index.js
├── .env
└── package.json

```
2. Add Your OpenAI API Key
    1. Copy the example environment file:
    ```bash
        cp .env.example .env
    ```

    2. Open .env and replace the placeholder value with your actual OpenAI API key:

        OPENAI_API_KEY=sk-your-key-here

    3. Save the file.

    4. Start the generator:
    ```bash
        npm start
    ```

The generator will parse your Visualforce files, then output Markdown documentation in the /docs folder.

### Exampple output:
```bash
/docs
 ├── VisualforcePages.md
 ├── ApexClasses.md
 └── Summary.md
 ```

## 🌍 Keywords

Salesforce, Visualforce, Apex, Documentation Generator, Markdown, Node.js, Salesforce Developer Tool

## 💡 Technologies Used

-   Node.js
-   Handlebars.js
-   JavaScript (ES6)
-   Salesforce Visualforce
-   Apex

## 🙌 Acknowledgements

This project was **inspired by the Cloudity** and the ideas shared by **TAHA BASRI**.  
Special thanks to the **SFDX-Hardis** team for their open-source contributions to the Salesforce developer community.

## 🤝 Contributing

Contributions, feedback, and suggestions are welcome!  
If you’re part of the **SFDX-Hardis** or **Cloudity** teams and want to integrate or extend this project, feel free to open an issue or pull request.

## 👤 Author

**Mohamed Amine GHARRAB** – https://github.com/M-A-Gharr/visualforce-ai-doc-generator
