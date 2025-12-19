import CryptoJS from "crypto-js";
import getBaseUrl from "./helpers/getBaseUrl";
import { LoginType } from "./helpers/enums";
import { confirmed_base_url } from "./constants/URLs";
const getQueryParam = (name) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};
const LOGIN_TYPE = getQueryParam("login_type");
const EMAIL_PARAM = getQueryParam("email");

const login = () => {
  if (LOGIN_TYPE === LoginType.SALESFORCE) {
    salesforceLogin();
  } else if (LOGIN_TYPE === LoginType.SIGNUP) {
    confirmedLogin(EMAIL_PARAM);
  } else {
    confirmedLogin();
  }
};

const confirmedLogin = (loginHint = null) => {
  const baseUrl = getBaseUrl();

  const verifier = generateCodeVerifier();

  localStorage.setItem("verifier", verifier);

  const codeChallenge = generateCodeChallenge(verifier);

  const authURL = `https://auth.confirmedapp.com/authorize?response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&client_id=vSvEwp0R57CDjXP3ylh71GtbG2jZdiaO&redirect_uri=${baseUrl}/callback.html&scope=openid%20profile%20email&audience=http://confirmedservice.confirmedapp.com&state=ABC123XYZConfirmed`;


  if (loginHint) {
    authURL += `&screen_hint=signup&login_hint=${encodeURIComponent(loginHint)}`;
  } else if (LOGIN_TYPE === LoginType.SIGNUP) {
    authURL += `&screen_hint=signup`;
  }

  window.location.href = authURL;
};

const salesforceLogin = async () => {
  try {

    const baseUrl = getBaseUrl();
    const redirectUrl = `${baseUrl}/callback.html`;

    const accessToken = getQueryParam("access_token");

    if (!accessToken || typeof accessToken !== 'string') {
      console.error(" No Confirmed access token found in popup URL");
      alert("Authentication error: No access token available. Please try logging in again.");
      return;
    }

    localStorage.setItem("confirmed_access_token", accessToken);

    const apiUrl = `${confirmed_base_url}/api/salesforce/auth/login?redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`;


    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API failed:", response.status, errorText);
      alert(`Salesforce login failed: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();

    if (result && result.loginUrl) {
      window.location.href = result.loginUrl;
    } else {
      alert("Salesforce login failed: No login URL received from server");
    }
  } catch (err) {
    console.error("Unexpected error in salesforceLogin:", err);
    alert(`Salesforce login error: ${err.message}`);
  }
};

const generateCodeVerifier = () => {
  var rand = new Uint8Array(32);
  crypto.getRandomValues(rand);
  return base64URL(new CryptoJS.lib.WordArray.init(rand));
};

const generateCodeChallenge = (code_verifier) => {
  return base64URL(CryptoJS.SHA256(code_verifier));
};

const base64URL = (string) => {
  return string.toString(CryptoJS.enc.Base64).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

// Execute login immediately
login();
