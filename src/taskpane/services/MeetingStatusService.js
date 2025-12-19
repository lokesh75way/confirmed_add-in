import axios from "axios";
import {
  confirmed_base_url,
  confirmed_webend_url,
  confirmed_service_meetings_url
} from "../constants/URLs";

/**
 * Call all of the meeting status.
 * Including information about the apis links about send reminder emails, withdraw the meeting,
 * and change the configurations of the meeting.
 * @param {*} userName user name of this account
 * @param {*} accessToken: the token used to call apis
 * @return invitations
 */
const listMeetingStatus = async (userName, accessToken, index, pageSize, setTotalRecords) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const invitationSummarys = await axios
    .post(
      `${confirmed_service_meetings_url}`,
      {
        Subject: "",
        RecipientFirstName: "",
        RecipientLastName: "",
        PageNumber: index,
        ResultsPerPage: pageSize,
      },
      {
        headers: headers,
      }
    )
    .then((response) => {
      return response.data;
    });

  setTotalRecords(invitationSummarys.totalRecords);

  const invitations = invitationSummarys.meetings.map(async (each) => {
    return {
      remindLink: `${confirmed_base_url}/api/invitations/sendReminder/${each.id}`,
      withdrawLink: `${confirmed_base_url}/api/invitations/${each.id}`,
      changeLink: `${confirmed_webend_url}scheduler/update/false/${each.id}`,
      ...each,
    };
  });
  return Object.values(invitations);
};

export { listMeetingStatus };
