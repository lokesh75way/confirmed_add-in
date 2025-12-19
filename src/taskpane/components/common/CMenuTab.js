import React, { useState } from "react";
import styled from "styled-components";
import VFlexCals from "../../views/VFlexCals";
import VMeetingStatus from "../../views/VMeetingStatus";
import VConnect from "../../views/VConnect";

// Change 'active' prop to '$active' transient prop
const Tab = styled.button`
  ${({ $active }) =>
    $active &&
    `
    border-bottom: 2px solid #41978F;
  `}
`;
const ButtonGroup = styled.div`
  position: fixed;
  display: flex;
  flex-direction: row;
  z-index: 50;
  top: 0;
  width: 100%;
`;
const types = ["Scheduling", "Meetings", "Connect",];
/**
 * Returns a menu component with meeting status, flex cal and connect tabs.
 * @param {*} userName user name of this account
 * @param {*} accessToken: the token used to call apis
 * @param {*} sfAccessToken: the token used to call salesforce apis
 * @param {*} setSfAccessToken: setter function for the salesforce api token
 * @param {*} sfTokenExpiresAt: when the salesforce token expires in Unix ts
 * @param {*} setSfTokenExpiresAt: setter function for when the salesforce token expires
 * @return menu component
 */
function CMenuTab({ userName, accessToken, sfAccessToken, setSfAccessToken, sfTokenExpiresAt, setSfTokenExpiresAt, isSalesforceConnected, setIsSalesforceConnected }) {
  const [active, setActive] = useState(types[0]);
  return (
    <>
      <ButtonGroup>
        {types.map((type) => (
          <Tab key={type} className="menu-tab" $active={active === type} onClick={() => setActive(type)}>
            {type}
          </Tab>
        ))}
      </ButtonGroup>
      {renderTab(active, userName, accessToken, sfAccessToken, setSfAccessToken, sfTokenExpiresAt, setSfTokenExpiresAt, isSalesforceConnected, setIsSalesforceConnected)}
    </>
  );
}

/**
 * Returns single tab for flex call or meeting status.
 * @param active to denote if a tab is currently active
 * @param {*} userName user name of this account
 * @param {*} accessToken: the token used to call apis
 * @return invitations
 */
function renderTab(active, userName, accessToken, sfAccessToken, setSfAccessToken, sfTokenExpiresAt, setSfTokenExpiresAt, isSalesforceConnected, setIsSalesforceConnected) {
  switch (active) {
    case "Scheduling":
      return <VFlexCals userName={userName} accessToken={accessToken} sfAccessToken={sfAccessToken} isSalesforceConnected={isSalesforceConnected} />;
    case "Meetings":
      return <VMeetingStatus userName={userName} accessToken={accessToken} />;
    case "Connect":
      return (
        <VConnect
          accessToken={accessToken}
          sfAccessToken={sfAccessToken}
          setSfAccessToken={setSfAccessToken}
          sfTokenExpiresAt={sfTokenExpiresAt}
          setSfTokenExpiresAt={setSfTokenExpiresAt}
          isSalesforceConnected={isSalesforceConnected}
          setIsSalesforceConnected={setIsSalesforceConnected}
        />
      );
    default:
      return null;
  }
}

export default CMenuTab;
