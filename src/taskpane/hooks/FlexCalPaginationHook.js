import useSWRInfinite from "swr";
import { listPaginationFlexCalForUser } from "../services/FlexCalPaginationService";
import UpdateLocalStorageService from "../services/UpdateLocalStorageService";

/**
 * The hook that uses SWR cache to get cached flexCal data, and
 * invoke listFlexCalForUser that sends a request asynchronously to
 * revalidate the flexCal data.
 * @param {*} param0 initialData (cahced) and the access token
 * @returns {*} flexCal data
 */
export function useFlexCalPaginationData({ initialData, userName, accessToken, nameFilter, pageNumber, pageSize, setTotalRecords }) {
  // fc is the key used to identify the cached flexCal data
  const { data } = useSWRInfinite(
    { pageNumber, nameFilter },
    () =>
      listPaginationFlexCalForUser(userName, accessToken, nameFilter, pageNumber, pageSize, setTotalRecords)
        .then(async (res) => {
          const flexcals = await Promise.all(res);
          return flexcals;
        })
        .catch((err) => {
          console.log(err);
        }),
    {
      initialData,
    }
  );
    
  UpdateLocalStorageService();

  return data;
}