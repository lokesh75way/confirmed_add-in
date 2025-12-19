import axios from "axios";
import { auth0_userinfo_url } from "../constants/URLs";

const getUserInfo = async (accessToken) => {

  const options = {
    method: "GET",
    url: `${auth0_userinfo_url}`,
    headers: {
      Authorization: `Bearer ${accessToken.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const response = await axios.request(options);
  return response.data;
};

export default getUserInfo;
