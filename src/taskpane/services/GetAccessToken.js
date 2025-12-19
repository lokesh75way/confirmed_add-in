import axios from "axios";
import getBaseUrl from "../helpers/getBaseUrl";

const getAccessToken = async (code, setAccessToken, setTokenExpiresAt, _codeVerifier) => {
  const codeVerifier = _codeVerifier ?? localStorage.getItem("verifier");

  const baseUrl = getBaseUrl();

  const options = {
    method: "POST",
    url: "https://auth.confirmedapp.com/oauth/token",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "vSvEwp0R57CDjXP3ylh71GtbG2jZdiaO",
      code_verifier: codeVerifier,
      code: code,
      redirect_uri: `${baseUrl}/callback.html`,
    }),
  };

  return axios
    .request(options)
    .then((response) => {
      setTokenExpiresAt((tokenExpiresAt) => ({
        ...tokenExpiresAt,
        ["token_expires_at"]: Date.now() + 24 * 60 * 60 * 1000,
      }));
      setAccessToken((accessToken) => ({
        ...accessToken,
        ["access_token"]: response.data.access_token,
        ["id_token"]: response.data.id_token
      }));
      return response.data;
    })
    .catch(function (error) {
      console.error(error);
      return error;
    });
};

export default getAccessToken;
