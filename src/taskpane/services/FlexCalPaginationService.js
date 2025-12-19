import axios from "axios";
import { confirmed_base_url } from "../constants/URLs";
/**
 * The function that sends a request to the lazycalendar api
 * and get all the flexCals of the user.
 * @param {*} accessToken
 * @returns {*} the list of flexCal of the user
 */
const listPaginationFlexCalForUser = async (
  userName,
  accessToken,
  nameFilter,
  pageNumber,
  pageSize,
  setTotalRecords
) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const name = nameFilter === undefined ? "" : nameFilter;
  const size = pageSize === undefined ? 10 : pageSize;
  const number = pageNumber === undefined ? 0 : pageNumber;

  const flexCalSummary = await axios
    .get(
      `${confirmed_base_url}/api/lazycalendar/summary?pageNumber=${number}&resultsPerPage=${size}&nameFilter=${name}`,
      {
        headers: headers,
      }
    )
    .then((response) => {
      return response.data;
    });
  setTotalRecords(flexCalSummary.totalRecords);

  const flexCals = flexCalSummary.lazyCalendars;

  return Object.values(flexCals);
};

export { listPaginationFlexCalForUser };
