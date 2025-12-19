import React, { useEffect, useState } from "react";
import { confirmed_base_url } from "../../constants/URLs";
import { Button, Spinner } from "react-bootstrap";
import { MdLogout } from "react-icons/md";

const CSalesforceLogout = ({ setSfAccessToken, setIsSalesforceConnected, accessToken }) => {
  const [logoutClicked, setLogoutClicked] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const apiUrl = `${confirmed_base_url}/api/salesforce/auth/disconnect`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });

    } catch (error) {
      console.error("Error calling logout API:", error);
    } finally {
      setSfAccessToken({ data: "" });

      if (setIsSalesforceConnected) {
        setIsSalesforceConnected(false);
      }
      localStorage.removeItem("confirmed_access_token");

      setLogoutClicked(false);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (logoutClicked) {
      handleLogout();
    }
  }, [logoutClicked]);

  const salesforceColor = getComputedStyle(document.documentElement).getPropertyValue("--salesforce");

  return (
    <Button
      onClick={() => setLogoutClicked(true)}
      className="m-3"
      style={{ width: "70%", backgroundColor: salesforceColor, borderColor: salesforceColor }}
      disabled={isLoggingOut}
    >
      <MdLogout style={{ marginRight: ".5rem" }} />
      {isLoggingOut ? (
        <>
          Logging out...
          <Spinner animation="border" size="sm" style={{ marginLeft: ".5rem" }} />
        </>
      ) : (
        "Logout of Salesforce"
      )}
    </Button>
  );
};

export default CSalesforceLogout;