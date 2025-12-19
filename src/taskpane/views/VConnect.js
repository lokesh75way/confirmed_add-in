import { useEffect } from "react";
import showLoginPopup from "../helpers/showLoginPopup";
import { LoginType } from "../helpers/enums";
import Button from "react-bootstrap/Button";
import { SiSalesforce } from "react-icons/si";
import CLogRecord from "../components/connect/CLogRecord";
import { confirmed_base_url } from "../constants/URLs";

/**
 * Returns the Connect view.
 * @param {*} accessToken: the Confirmed API access token from the parent window
 * @param {*} sfAccessToken: the token used to call salesforce apis
 * @param {*} setSfAccessToken: setter function for the salesforce api token
 * @param {*} sfTokenExpiresAt: when the salesforce token expires in Unix ts
 * @param {*} setSfTokenExpiresAt: setter function for when the salesforce token expires
 * @return Connect view
 */
const VConnect = ({ accessToken, sfAccessToken, setSfAccessToken, sfTokenExpiresAt, setSfTokenExpiresAt, isSalesforceConnected, setIsSalesforceConnected }) => {

  const checkSalesforceConnection = async (externalController) => {
    const controller = externalController ?? new AbortController();

    try {
      const apiUrl = `${confirmed_base_url}/api/account/GetSubscriberInfo`;
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        setIsSalesforceConnected(false);
        return;
      }

      const data = await response.json();

      const isConnected = data.isSalesforceConnected || false;
      setIsSalesforceConnected(isConnected);

    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      console.error("Error checking Salesforce connection:", error);
      setIsSalesforceConnected(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    checkSalesforceConnection(controller);
    return () => {
      controller.abort();
    };
  }, []);

  const handleLoginClick = () => {
    showLoginPopup(
      LoginType.SALESFORCE,
      setSfAccessToken,
      setSfTokenExpiresAt,
      accessToken,
      setIsSalesforceConnected,
      null,
      null,
      checkSalesforceConnection
    );
  };

  return (
    <div className="connect-list">
      {isSalesforceConnected ? (
        <CLogRecord sfAccessToken={sfAccessToken} setSfAccessToken={setSfAccessToken} setIsSalesforceConnected={setIsSalesforceConnected} accessToken={accessToken} />
      ) : (
        <Button onClick={handleLoginClick} className="salesforce-login-btn">
          <SiSalesforce style={{ marginRight: '.5rem' }} /> Sign into Salesforce
        </Button>
      )}
    </div>
  );
};

export default VConnect;
