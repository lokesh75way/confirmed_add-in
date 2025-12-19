const fs = require('fs');
const path = require('path');

// File paths
const manifestPath = path.join(__dirname, '../manifest.xml');
const localManifestPath = path.join(__dirname, '../manifest.local.xml');

// Local development URLs
const localBaseUrl = 'https://localhost:3000';

// Read the manifest.xml file
fs.readFile(manifestPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading manifest.xml:', err);
    return;
  }

  // Replace production URLs with local development URLs
  let localManifest = data.replace(/https:\/\/confirmedoutlookaddin\.z20\.web\.core\.windows\.net/g, localBaseUrl);

  // Write the updated content to manifest.local.xml
  fs.writeFile(localManifestPath, localManifest, 'utf8', (err) => {
    if (err) {
      console.error('Error writing manifest.local.xml:', err);
    } else {
      console.log('manifest.local.xml has been generated successfully.');
    }
  });
});