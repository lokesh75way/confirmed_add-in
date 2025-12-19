const getSalesforceToken = (authPayload, setAccessToken, setTokenExpiresAt, setIsSalesforceConnected) => {
    if (setIsSalesforceConnected && typeof authPayload.isSalesforceConnected === 'boolean') {
        setIsSalesforceConnected(authPayload.isSalesforceConnected);
    }

};

export default getSalesforceToken;