import { listMeetingStatus } from "../services/MeetingStatusService";
import useSWRInfinite from "swr";
import UpdateLocalStorageService from "../services/UpdateLocalStorageService";

export function useMeetingStatusData({
  initialData = undefined,
  userName,
  accessToken,
  index,
  pageSize,
  setTotalRecords,
}) {
  const { data } = useSWRInfinite(
    { index },
    () =>
      listMeetingStatus(userName, accessToken, index, pageSize, setTotalRecords)
        .then(async (res) => {
          const invitations_without_promise = await Promise.all(res);
          invitations_without_promise.sort(
            (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
          );
          return invitations_without_promise;
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
