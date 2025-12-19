import { confirmed_base_url } from "../constants/URLs";

const recordEmailAsTask = async (email) => {

  const accessTokenData = localStorage.getItem("access_token");

  if (!accessTokenData) {
    console.error("No access token found in localStorage");
    throw new Error("Authentication required: No access token found");
  }

  let token;
  try {
    const tokenObj = JSON.parse(accessTokenData);
    token = tokenObj.access_token;
  } catch (parseError) {
    console.error("Failed to parse access token from localStorage:", parseError);
    throw new Error("Invalid access token format");
  }

  if (!token) {
    console.error("No access_token property found in localStorage data");
    throw new Error("Invalid access token: missing access_token property");
  }

  const apiUrl = `${confirmed_base_url}/api/salesforce/recordEmailAsTask`;

  const data = {
    ...email,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response;
};

export default recordEmailAsTask;