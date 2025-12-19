import React, { useEffect, useState } from "react";
import { useMeetingStatusData } from "../hooks/MeetingStatusHook";
import { Form } from "react-bootstrap";
import CMeetingStatusCard from "../components/common/CMeetingStatusCard";
import CLoading from "../components/common/CLoading";
import PropTypes from "prop-types";
import Button from "react-bootstrap/Button";

function Page({
  userName,
  accessToken,
  index,
  query,
  pageSize,
  setTotalRecords,
}) {
  const invitations = useMeetingStatusData({
    initialData: undefined,
    userName,
    accessToken,
    index,
    pageSize,
    setTotalRecords,
  });
  const [currMeetingStatus, setCurrMeetingStatus] = useState();
  useEffect(() => {
    setCurrMeetingStatus(invitations);
  }, [invitations]);

  const doQuery = (post, query) => {
    var querySplit = query.split(" ");
    for (var i = 0; i < querySplit.length; i++) {
      var subQuery = querySplit[i];
      if (subQuery === "") continue;
      if (
        post.subject?.toLowerCase().includes(subQuery.toLowerCase()) ||
        post.recipientFirstName
          ?.toLowerCase()
          .includes(subQuery.toLowerCase()) ||
        post.recipientLastName?.toLowerCase().includes(subQuery.toLowerCase())
      ) {
        return true;
      }
    }
    return false;
  };

  return currMeetingStatus === undefined || currMeetingStatus === null ? (
    <CLoading />
  ) : (
    <div>
      {currMeetingStatus
        .filter((post) => {
          if (query === "") {
            return post;
          } else if (doQuery(post, query)) {
            return post;
          } else {
            return null;
          }
        })
        .map((invitation, idx) => (
          <div key={idx}>
            <CMeetingStatusCard
              invitation={invitation}
              accessToken={accessToken}
            />
          </div>
        ))}
    </div>
  );
}

const VMeetingStatus = ({ userName, accessToken }) => {
  // const [index, setIndex] = useState(0);

  const [cnt, setCnt] = useState(1);
  const [query, setQuery] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 3;

  useEffect(() => {
    // load page number from local storage
    const page = JSON.parse(localStorage.getItem("page_meeting_status") || 1);
    if (page) {
      setCnt(page);
    }
  }, []);

  const pages = [];
  for (let i = 0; i < cnt; i++) {
    pages.push(
      <Page
        userName={userName}
        accessToken={accessToken}
        index={i}
        query={query}
        key={i}
        pageSize={pageSize}
        setTotalRecords={setTotalRecords}
      />
    );
  }
  return (
    <div className="card-container">
      <div className="meeting-status-search-bar">
        <Form.Group className="meeting-status-form-name w-100">
          <Form.Control
            className="mb-1 w-100"
            size="sm"
            type="text"
            name="searchmeeting"
            placeholder="Search meetings"
            onChange={(event) => setQuery(event.target.value)}
          />
        </Form.Group>
      </div>
      <div className="header-margin">
        {pages}
      </div>
      <div className="load-more">
        {cnt * pageSize < totalRecords ? (
          <Button
            className="primary-btn"
            onClick={() => {
              if (cnt * 1 < totalRecords) {
                setCnt(cnt + 1);
                localStorage.setItem("page_meeting_status", cnt + 1);
              }
            }}
          >
            Load More
          </Button>
        ) : (
          <Button className="primary-btn" disabled>
            Load More
          </Button>
        )}
      </div>
    </div>
  );
};

VMeetingStatus.propTypes = {
  userName: PropTypes.string.isRequired,
  accessToken: PropTypes.string.isRequired,
};

export default VMeetingStatus;
