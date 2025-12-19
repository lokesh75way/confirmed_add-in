import useSWR from "swr";
import { listContactsForUser } from "../services/ContactsService";
import UpdateLocalStorageService from "../services/UpdateLocalStorageService";

/**
 * The hook that uses SWR cache to get cached flexCal data, and
 * invoke listFlexCalForUser that sends a request asynchronously to
 * revalidate the flexCal data.
 * @param {*} param0 initialData (cahced) and the access token
 * @returns {*} flexCal data
 */
export function useContactsData({ initialData, accessToken, userName }) {
  // contacts is the key used to identify the cached flexCal data
  const { data } = useSWR(
    "contacts",
    () =>
      listContactsForUser(accessToken, userName)
        .then(async (res) => {
          const contacts = await Promise.all(res);
          return contacts;
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
