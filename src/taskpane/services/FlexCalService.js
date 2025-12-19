import axios from "axios";
import { confirmed_base_url } from "../constants/URLs";
/**
 * The function that sends a request to the lazycalendar api
 * and get all the flexCals of the user.
 * @param {*} accessToken
 * @returns {*} the list of flexCal of the user
 */
const listFlexCalForUser = async (accessToken) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = await axios
    .get(`${confirmed_base_url}/api/lazycalendar`, {
      headers: headers,
    })
    .then((response) => {
      return response.data;
    });
  return data;
};

export { listFlexCalForUser };
