import useSWR from "swr";
import { listFlexCalForUser } from "../services/FlexCalService";
import UpdateLocalStorageService from "../services/UpdateLocalStorageService";

/**
 * The hook that uses SWR cache to get cached flexCal data, and
 * invoke listFlexCalForUser that sends a request asynchronously to
 * revalidate the flexCal data.
 * @param {*} param0 initialData (cahced) and the access token
 * @returns {*} flexCal data
 */
export function useFlexCalData({ initialData, accessToken }) {
  // fc is the key used to identify the cached flexCal data
  const { data } = useSWR(
    "fc",
    () =>
      listFlexCalForUser(accessToken)
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
