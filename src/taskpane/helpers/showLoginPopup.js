import getAccessToken from "../services/GetAccessToken";
import getSalesforceToken from "../services/GetSalesforceToken";
import { LoginType } from "./enums";

import RegisterService from "../services/RegisterService";

const showLoginPopup = (
  loginType,
  setAccessToken,
  setTokenExpiresAt,
  accessToken = null,
  setIsSalesforceConnected = null,
  email = null,
  registrationDataResult = null,
  onLoginSuccess = null,
  onPopupClosed = null
) => {
  /* global Office */

  const params = new URLSearchParams({ login_type: loginType });

  const tokenString = typeof accessToken === 'string' ? accessToken : accessToken?.access_token;



  if (tokenString) {
    params.append('access_token', tokenString);
  } else {
    console.warn("No access token available to pass to popup");
  }

  if (email) {
    params.append('email', email);
  }

  const url = `${window.location.origin}/popup.html?${params.toString()}`;

  // height and width are percentages of the size of the screen.
  Office.context.ui.displayDialogAsync(url, { height: 70, width: 28 }, (result) => {
    if (result.status === Office.AsyncResultStatus.Failed) {
      if (onPopupClosed) {
        onPopupClosed();
      }
      return;
    }

    const dialog = result.value;

    dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg) => {
      if (arg.error === 12006 && onPopupClosed) {
        onPopupClosed();
      }
    });

    dialog.addEventHandler(Office.EventType.DialogMessageReceived, async (args) => {
      dialog.close();

      try {
        const message = JSON.parse(args.message);

        if (loginType === LoginType.CONFIRMED) {
          await getAccessToken(message.code, setAccessToken, setTokenExpiresAt, message.codeVerifier);
        }
        if (loginType === LoginType.SIGNUP) {
          const tokenData = await getAccessToken(message.code, setAccessToken, setTokenExpiresAt, message.codeVerifier);

          if (onLoginSuccess && tokenData) {

            let emailFromToken = null;
            const tokenToDecode = tokenData.id_token || tokenData.access_token;
            if (tokenToDecode) {
              const decodedIdToken = RegisterService.decodeToken(tokenToDecode);
              if (decodedIdToken && decodedIdToken.email) {
                emailFromToken = decodedIdToken.email;
              }
            }

            await onLoginSuccess(tokenData.access_token, tokenData.expires_in, emailFromToken);
            return;
          }

          const finalRegistrationData = registrationDataResult || message.registrationData;

          if (tokenData && finalRegistrationData) {
            const decoded = RegisterService.decodeToken(tokenData.access_token);

            if (decoded && decoded.sub) {
              const parts = decoded.sub.split('|');
              finalRegistrationData.UserName = parts.length > 1 ? parts[1] : parts[0];
            }

            const tokenToDecode = tokenData.id_token || tokenData.access_token;
            const decodedIdToken = RegisterService.decodeToken(tokenToDecode);

            if (decodedIdToken && decodedIdToken.email) {
              finalRegistrationData.EmailAddress = decodedIdToken.email;
            }

            await RegisterService.createAccount(tokenData.access_token, finalRegistrationData);
          }
        }

        if (loginType === LoginType.SALESFORCE) {
          getSalesforceToken(message, setAccessToken, setTokenExpiresAt, setIsSalesforceConnected);

          if (onLoginSuccess) {
            await onLoginSuccess();
          }
        }
      } catch (error) {
        // Handle error if getAccessToken fails
        console.error("Failed to retrieve access token", error);
      }
    });
  });
};

export default showLoginPopup;
