/**
 * Gets the add-in version from the manifest.xml file
 * @returns {Promise<string>} A promise that resolves to the version string
 */
const getManifestVersion = async () => {
  try {
    // Get the appropriate manifest URL based on environment
    const manifestUrl = process.env.NODE_ENV === "production" 
      ? "/manifest.xml" 
      : "/manifest.local.xml";
    
    const response = await fetch(manifestUrl);
    const xmlText = await response.text();
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Extract the version
    const versionNode = xmlDoc.querySelector("OfficeApp > Version");
    return versionNode ? versionNode.textContent : "Version unknown";
  } catch (error) {
    console.error("Error fetching manifest version:", error);
    return "Version unknown";
  }
};

export { getManifestVersion };
