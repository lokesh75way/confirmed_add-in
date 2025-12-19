// confirmed app base url - local
//const confirmed_base_url = "http://localhost:39955/"

// confirmed app base url - staging
////////const confirmed_base_url = "https://confirmedservice-staging.azurewebsites.net/";

// confirmed app base url - prod
//const confirmed_base_url = "https://confirmedservice.confirmedapp.com/";

// confirmed webend url
////////const confirmed_webend_url = "https://www.confirmedapp.com/";
//const confirmed_webend_url = "https://confirmedapp-staging.azurewebsites.net/";

////////export { confirmed_base_url, confirmed_webend_url };

//filepath: src/taskpane/constants/URLs.js

/**
 * Base URL for the Confirmed service API (production). Swap for staging or local as needed.
 */
const confirmed_base_url = "https://confirmedservice.confirmedapp.com";

/**
 * Base URL for the Confirmed web frontend (production). Swap for staging or local as needed.
 */
const confirmed_webend_url = "https://www.confirmedapp.com/";

/**
 * Base URL for OAuth2 operations (authorization and token) against Confirmed auth server.
 */
const auth_base_url = "https://auth.confirmedapp.com";

/**
 * Relative path of the local callback page where OAuth2 responses are returned.
 */
const callback_path = "/callback.html";

/**
 * URL for retrieving user profile information from Auth0 (Confirmed user info endpoint).
 */
const auth0_userinfo_url = "https://confirmed.auth0.com/userinfo";

/**
 * URL to initiate Salesforce authentication via Confirmed Connect service.
 */
const salesforce_auth_url = "https://confirmedconnectservice.azurewebsites.net/salesforce/auth";

/**
 * Base URL for Confirmed Connect services (e.g., Salesforce integrations).
 */
const confirmed_connect_service_base = "https://confirmedconnectservice.azurewebsites.net";

/**
 * Full endpoint for recording an email as a task in Salesforce via Confirmed Connect.
 */
const record_email_task_url = `${confirmed_connect_service_base}/salesforce/record-email-as-task`;

/**
 * Base URL for Confirmed API endpoints (common prefix for other API routes).
 */
//const confirmed_service_api_base = `${confirmed_base_url}api/invitations/meetings`;

/**
 * Full endpoint to fetch meeting invitations from Confirmed service.
 */
const confirmed_service_meetings_url = `${confirmed_base_url}/api/invitations/meetings`;

/**
 * URL for the VLogin under-login image placeholder.
 */
const under_login_image_url = "https://use.confirmedapp.com/outlook/underlogin";

/**
 * URL to load Office.js library for Office Add-ins.
 */
const office_js_url = "https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js";

/**
 * URL to load Office UI Fabric (Fluent) CSS from SharePoint Online.
 */
const office_fabric_css_url =
  "https://static2.sharepointonline.com/files/fabric/office-ui-fabric-core/11.0.0/css/fabric.min.css";

export {
  auth0_userinfo_url /**/,
  auth_base_url /**/,
  callback_path /**/,
  confirmed_base_url /**/,
  confirmed_connect_service_base /**/,
  confirmed_service_meetings_url /**/,
  confirmed_webend_url /**/,
  /**/ office_fabric_css_url,
  /**/ office_js_url,
  record_email_task_url /**/,
  salesforce_auth_url /**/,
  under_login_image_url,
};
