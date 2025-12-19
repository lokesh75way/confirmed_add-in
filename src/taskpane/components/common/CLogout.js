import React, { useEffect, useState } from "react";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { MdLogout } from "react-icons/md";

const CLogOut = ({ setTokenExpiresAt, setAccessToken, setSfAccessToken, sfAccessToken, setAuthView }) => {
  const [logoutClicked, setLogoutClicked] = useState(false);

  useEffect(() => {
    if (logoutClicked) {
      // Clear token information for the main app
      setTokenExpiresAt((tokenExpiresAt) => ({
        ...tokenExpiresAt,
        ["token_expires_at"]: 0,
      }));
      setAccessToken((accessToken) => ({ ...accessToken, ["access_token"]: "" }));

      // Check if the user is logged into Salesforce before attempting to log out
      if (sfAccessToken && setSfAccessToken) {
        setSfAccessToken((sfAccessToken) => ({ ...sfAccessToken, ["data"]: "" }));
      }

      if (setAuthView) {
        setAuthView("login");
      }

      setLogoutClicked(false);
    }
  }, [logoutClicked, setTokenExpiresAt, setAccessToken, setSfAccessToken, sfAccessToken, setAuthView]);

  const tooltip = <Tooltip id="logout-tooltip">Logout</Tooltip>;

  return (
    <OverlayTrigger placement="top" overlay={tooltip}>
      <button onClick={() => setLogoutClicked(true)} className="logout" id="logout-button">
        <MdLogout />
      </button>
    </OverlayTrigger>
  );
};

export default CLogOut;
