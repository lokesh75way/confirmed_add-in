<p align="center">
  <img src="assets/logo512.png">
</p>

[![GitBook Badge](https://img.shields.io/badge/Wiki-Confirmed-green)](https://app.gitbook.com/o/NROybQaDugTsIraTimmK/s/zpoSlu2OUIPSL3meeGoi/)
![React Badge](https://img.shields.io/badge/React-18.2-red)
[![Slack Badge](https://img.shields.io/badge/Slack-Confirmed-orange)](https://join.slack.com/t/confirmedllccapstone)

<h1 align="center">Confirmed Outlook Extension in JavaScript</h1>
<p align="center">Confirmed Extension aims to help clients <strong>easily</strong> and <strong>conveniently</strong> use Confirmed services.</p>
<br/>

## Summary

The major difference between this one with another repo https://github.com/soapy13/ConfirmedOutlookAddin is that this version is written in JS and it creates a dialog box for auth0 pop up. It will get the access token after user login. After successfully login, the dialog box will close.

It is expected to back to taskpane and render the page.

## Development

Follow the guideline in GitBook for how to develop one feature.

### Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 16.x or later recommended)
2. Clone the repository to your local machine
3. Open a terminal/command prompt in the project directory
4. Install dependencies:

```shell
npm install
```

This will install all required packages including webpack and other development tools needed to run the project.

### Testing in your local browser

1. Manually add the Outlook Add-in by:

- clicking on clicking on an email
- Select <strong>More Actions</strong> on the email
- Select on the drop down <strong>Get Add-ins</strong>
- Select <strong>My Add-ins</strong>
- Scroll down to <strong>Customize Add-ins</strong> and <strong>Add a Custom Add-in from File</strong>
- Navigate to the profject root folder and select the file `manifest.xml`

2. using npm command to run in desktop outlook.

- First manually add the Outlook Add in to Outlook
- Then run:

```shell
npm run dev-server
```

**Note** - if sign-in stops working on local dev, run these steps in terminal:

1. `npx office-addin-dev-settings debugging manifest.local.xml --disable`
2. `npm run dev-server`
3. `npx office-addin-dev-settings sideload manifest.local.xml`

### Troubleshooting

If you see an error like `'webpack' is not recognized as an internal or external command`, it means the dependencies haven't been installed properly. Try these steps:

1. Make sure you've run `npm install` in the project directory
2. If issues persist, try deleting the `node_modules` folder and `package-lock.json` file, then run `npm install` again
3. Ensure you're using a compatible version of Node.js (check the engine requirements in package.json)

### Creating the manifest.local.xml file for local development and testing in Outlook

1. Create the new file `manifest.local.xml` in the root of the project directory by running the following command:

```shell
node src/generateManifest.js
```
2. This will create a new file called `manifest.local.xml` in the root of the project directory. This file is used for local development and testing in Outlook by sideloading it.

# Confirmed Outlook Add-In

## Version Management and Deployment Guide

### Updating Version Number

1. **Edit the manifest.xml file**
   - Open `manifest.xml` in the project root
   - Update the version number in the `<Version>` tag
   - Format: `Major.Minor.Build.Revision` (e.g., `2.1.1.1`)
   - Example:
     ```xml
  <Version>2.1.7.0</Version>
     ```

2. **Generate Updated Local Manifest**
   - Run `node src/generateManifest.js` to update the `manifest.local.xml` file
   - This will automatically pull in the version number from `manifest.xml`
   - The `ManifestService.js` file will handle the versioning logic to display the correct version in the add-in
   
### Publishing to Microsoft Partners

1. **Validate the manifest**
   - Run `npm run validate` to ensure the manifest is valid
   
2. **Submit to Partner Center**
   - Log in to [Partner Center](https://partner.microsoft.com/dashboard)
   - Navigate to your add-in submission
   - Upload the updated `manifest.xml` file
   - Complete the submission process according to Microsoft's requirements

### Deploying Code to Azure Blob Storage

1. **Prerequisites**
   - Install the "Azure Storage" extension in VS Code
   - Sign in to the extension using your Confirmed Microsoft account

2. **Build the project**
   - Open a terminal in the project root directory
   - Run the build command:
     ```
     npm run build
     ```

3. **Deploy to Azure Storage**
   - Right-click on the `dist` folder in VS Code
   - Select "Deploy to Static Website via Azure Storage..."
   - Choose "confirmedoutlookaddin" from the dropdown list
   - Wait for deployment to complete

4. **Verify deployment**
   - Check the deployment URL (typically https://confirmedoutlookaddin.z20.web.core.windows.net)
   - Ensure the add-in loads correctly

## Version History
- 2.1.7.0: Migrated salesforce from local to backend
- 2.1.6.2: Revision of icons
- 2.1.6.1: Bug fixes for the sync button logic
- 2.1.6.0: Implemented the sync button to sync meeting contacts on button click
- 2.1.5.6: Bug fixes in cache clearing
- 2.1.5.5: Implmented clearing the cache on logout
- 2.1.5.4: Moved the hardcoded URLs to URLs.js files.
- 2.1.5.3: Added functionality to select the contacts with keyboard
- 2.1.5.2: Made adjustments to the addition of contact source icons
- 2.1.5.1: Enlarged the dropdown list for prefill UI, added the display of phone numbers and created new logic to deal with contacts from various sources
- 2.1.5.0: Tweaked the GUI for better user experience while entering the prefill information
- 2.1.4.1: Enhanced Salesforce contacts fetching with improved logging and caching logic
- 2.1.4.0: Integrate Salesforce contacts fetching functionality
- 2.1.3.0: Added functionality to obtain prefill data from previous meetings and caching the data
- 2.1.2.0: New functionality to open Salesforce Edit Lead page, added green color for completed tasks and change in warning timings
- 2.1.1.1: Implemented logic for dynamic version display in login screen


## Development

- Run locally: `npm run dev-server`
- Test in Outlook Desktop: `npm run start:desktop`