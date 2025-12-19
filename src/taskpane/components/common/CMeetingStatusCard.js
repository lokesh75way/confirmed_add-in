import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  invitationStatusMapping
} from "../../constants/Variables";
import PropTypes from "prop-types";

/**
 * Display information about each meeting and operations to modify the meetings, send reminder email, remove
 * the meetings
 * @param {*} userName user name of this account
 * @param {*} accessToken: the token used to call apis
 */
const CMeetingStatusCard = ({ invitation, accessToken }) => {
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [invitationStatus, setInvitationStatus] = useState("");
  const [labelColor, setLabelColor]= useState("");

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  useEffect(() => {
    try {
      setRecipientName(
        `${invitation.recipientFirstName} ${invitation.recipientLastName}`
      );
      setSubject(invitation.subject);
      setInvitationStatus(invitationStatusMapping[invitation.state]);
      setLabelColor(getStatusColor(invitationStatusMapping[invitation.state]))
    } catch (e) {
      console.log(e);
    }
  }, [invitation]);

  async function remindReq() {
    await axios
      .post(
        invitation.remindLink,
        {},
        {
          headers: headers,
        }
      )
      .then((response) => {
        return response.data;
      });
  }

  async function withdrawReq() {
    await axios
      .delete(invitation.withdrawLink, {
        headers: headers,
      })
      .then((response) => {
        return response.data;
      });
  }

  return (
    <div className="meeting-status-card">
      <div className="meeting-status-icon-label">
        <span
          className={`meeting-status-action-label ${labelColor}`}
        >
          {invitationStatus}
        </span>
      </div>

      <div className="meeting-status-text-container">
        <div className="meeting-status-meeting-label">{recipientName}</div>
        <div className="meeting-status-meeting-label">{subject}</div>

        <div className="meeting-status-links">
            <a
              href={`https://use.confirmedapp.com/meetings?meetingId=${invitation.id}`}
              className="meeting-status-link"
              target="_blank"
              rel="noreferrer"
            >
              View More
            </a>
          </div>

        {/* {active ? (
          <div className="meeting-status-links">
            <div onClick={remindReq} className="meeting-status-link" href="">
              Remind
            </div>
            <div onClick={withdrawReq} className="meeting-status-link" href="">
              Withdraw
            </div>
          </div>
        ) : null} */}
      </div>
    </div>
  );
};

CMeetingStatusCard.propTypes = {
  accessToken: PropTypes.string.isRequired,
};

const getStatusColor = (status) => {
  switch (status) {
    case "Confirmed": {
      return 'teal';
    }
    case "Changed": {
      return 'amber';
    }
    case "Cancelled": {
      return 'red';
    }
    case "Countered": {
      return 'amber';
    }
    case "Pending": {
      return 'gray';
    }
    case "Rejected": {
      return 'red';
    }
    case "Withdrawn": {
      return 'amber';
    }
    default: {
      return 'red';
    }
  }
};

export default CMeetingStatusCard;
