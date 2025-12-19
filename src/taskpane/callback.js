/* global Office */
import { confirmed_base_url } from "./constants/URLs";

const callback = async () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const message = {};
  const codeVerifier = localStorage.getItem("verifier");
  const code = params.get("code");

  // Confirmed sign in callback message
  if (code) {
    message.code = code;
    message.codeVerifier = codeVerifier;

    const registrationForm = localStorage.getItem("registrationForm");
    if (registrationForm) {
      try {
        message.registrationData = JSON.parse(registrationForm);
      } catch (e) {
        console.error("Error parsing registration form data", e);
      }
    }
  } else {

    try {
      const accessToken = localStorage.getItem("confirmed_access_token");

      if (!accessToken) {
        message.error = "No access token found in localStorage";
        Office.onReady(() => Office.context.ui.messageParent(JSON.stringify(message)));
        return;
      }

      const apiUrl = `${confirmed_base_url}/api/account/GetSubscriberInfo`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        message.error = `API call failed: ${response.status}`;
        Office.onReady(() => Office.context.ui.messageParent(JSON.stringify(message)));
        return;
      }

      const data = await response.json();

      message.isSalesforceConnected = data.isSalesforceConnected || false;
      message.subscriberInfo = data;

    } catch (error) {
      console.error("Error in Salesforce callback:", error);
      message.error = error.message;
    }
  }
  Office.onReady(() => Office.context.ui.messageParent(JSON.stringify(message)));
};

document.addEventListener("DOMContentLoaded", callback);
