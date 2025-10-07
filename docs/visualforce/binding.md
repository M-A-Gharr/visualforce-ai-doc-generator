# Visualforce Page: binding

<details>
<summary>Overview</summary>

## Visualforce Page Overview: binding

The &#x27;binding&#x27; Visualforce page allows users to input a course name, which dynamically updates the displayed course information using AJAX. It features an input field for the course name and an output panel that reflects the current input in real-time.

### Purpose of the Page
This page exists to facilitate the entry and immediate display of course names, addressing the need for real-time feedback during data entry.

### Key Functions
- Allows data entry for course names
- Displays the entered course name dynamically
- Implements AJAX updates for real-time content changes


### Metadata
- **API Version**: 54.0
- **Label**: Binding

</details>

<details>
<summary>Controllers / Extensions</summary>

## Key Controllers / Extensions Used
- **Standard Controller**: None
- **Custom Controller**: BindingController
- **Extensions**: 
  None

</details>

<details>
<summary>Properties & Methods</summary>

## Properties
| Name | Type | Visibility | Modifiers | Description |
|------|------|------------|-----------|-------------|
| `courseName` | `String` | `public` | `` | Holds the value of the course name entered by the user. |  <-- ICI

## Methods
No public methods found in associated Apex controllers/extensions.

</details>

<details>
<summary>Page Structure</summary>

### Forms
- Contains 1 `apex:form` component(s).

### Inputs
The page utilizes the following input bindings/fields:
- `{!courseName}`

### Buttons
- No button actions (`apex:commandButton`, `apex:button`, `apex:commandLink`) detected.

</details>

<details>
<summary>AJAX Interactions</summary>

The page includes `apex:actionSupport` components for dynamic updates:
- **Event**: `onchange`
  - **Re-renders**: `courseInfo`
  - **Action**: `None`
  - **Status**: `None`
  - **Attached to**: `apex:inputText` (ID: `N/A`)

### Output Panels
The page utilizes the following `apex:outputPanel` components, often used as targets for AJAX re-renders:
- **ID**: `courseInfo`
  - **Layout**: `default (div)`
  - **Content Preview**: "Course name is: {!courseName}"

</details>

<details>
<summary>Page Block Structure</summary>

- *No `apex:pageBlock` components detected.*

</details>

<details>
<summary>Dependencies</summary>

### Objects
- No explicit SObject dependencies detected from bindings.

### Fields
- `courseName`

### Custom Components
- No custom components (`<c:componentName>`) detected.

### Static Resources
- No static resources (`$Resource.name`) detected.

### Scripts
- No script tags (`script` or `apex:includeScript`) detected.

</details>
