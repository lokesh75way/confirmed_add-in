import Card from "react-bootstrap/Card";
import { Button, Form, Row, Container, Col, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FiCopy, FiEdit } from "react-icons/fi";
import {
  MdAdd,
  MdDone,
  MdGroupAdd,
  MdOutlineClear,
  MdPlaylistAdd,
  MdOpenInNew,
  MdRemove,
  MdRemoveCircleOutline,
} from "react-icons/md";
import { FaUserAlt, FaCalendarAlt } from "react-icons/fa";
import { SiSalesforce } from "react-icons/si";
import { useState, useEffect } from "react";
import CAdditionalAttendeeField from "./CAdditionalAttendeeField";
import { attendeeInputType, prefillInfoType } from "../../constants/Variables";
import CPrefillField from "./CPrefillField";

/**
 * FlexCal card Component which represents a flexcal.
 * Including information like titles, descriptions, invitation link.
 * This component also allows for adding attendess to customize invitation link.
 * @param {*} props expected fields: edit URL, start date, name
 */
const CFlexCalCard = ({ flexCalCardData: { flexCal, contacts } }) => {
  const [additionalAttendees, setAdditionalAttendees] = useState([]); // attendees forms
  const [copied, setCopied] = useState(false);
  const [classicCopied, setClassicCopied] = useState(false);
  const [addAttendee, setAddAttendee] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState([{ email: "", firstName: "", lastName: "" }]);
  const [selectedParticpant, setSelectedParticipant] = useState([{ email: "", firstName: "", lastName: "" }]);
  const [addPrefillInfo, setAddPrefillInfo] = useState(false);
  const [prefillInfo, setPrefillInfo] = useState(undefined);
  const [attendeeOptionClicked, setAttendeeOptionClicked] = useState(false);
  const [participantOptionClicked, setParticipantOptionClicked] = useState(false);
  const [messageCompose, setMessageCompose] = useState(null);
  const [isComposeMode, setIsComposeMode] = useState(false);

  const getSourceIcon = (source) => {
    // Handle specific source values
    if (!source || source === "external") {
      return <FaUserAlt className="contact-source-icon user-icon" title="External Contact" />;
    }
    
    const sourceValue = source.toLowerCase();
    
    if (sourceValue.includes('salesforce')) {
      if (sourceValue.includes('lead')) {
        return <SiSalesforce className="contact-source-icon salesforce-icon" title="Salesforce Lead" />;
      } else {
        return <SiSalesforce className="contact-source-icon salesforce-icon" title="Salesforce Contact" />;
      }
    } else if (sourceValue === 'meeting') {
      return <img src="./../../../../assets/logo-16.png" className="contact-source-icon meeting-icon" title="Meeting Contact" />;
    } else {
      return <FaUserAlt className="contact-source-icon user-icon" title="External Contact" />;
    }
  };

  useEffect(() => {
    // Initialize Office.js and get the message compose object
    Office.onReady((info) => {
      if (info.host === Office.HostType.Outlook) {
        setMessageCompose(Office.context.mailbox.item);
      }

      //Checks to see if Outlook is in read or compose mode
      if (Office.context.mailbox.item.displayReplyForm != undefined) {
        setIsComposeMode(false);
      } else {
        setIsComposeMode(true);
      }
    });
  }, []);

  useEffect(() => {
    if (contacts) {
      console.log(`CFlexCalCard: Received ${contacts?.length || 0} contacts`);
      // Log a few contacts for debugging
      if (contacts && contacts.length > 0) {
        console.log("Sample contacts:", contacts.slice(0, 3));
      }
    }
  }, [contacts]);

  const writeToEmail = (url, isClassic) => {
    if (messageCompose) {
      messageCompose.body.getTypeAsync((asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.log(asyncResult.error.message);
          return;
        }

        if (asyncResult.value === Office.CoercionType.Html) {
          writeAsHTML(url, isClassic);
        } else {
          writeAsText(url, isClassic);
        }
      });
    }
  };

  const writeAsHTML = (url, isClassic) => {
    messageCompose.body.setSelectedDataAsync(
      `<a href="${url}"> ${url} </b>`,
      { coercionType: Office.CoercionType.Html },
      (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.log(asyncResult.error.message);
          if (isClassic) {
            setClassicCopied(true);
          } else {
            setCopied(true);
          }
          setTimeout(() => {
            setCopied(false);
          }, 5000);
          return;
        }
      }
    );
  };

  const writeAsText = (url, isClassic) => {
    messageCompose.body.setSelectedDataAsync(`${url}`, { coercionType: Office.CoercionType.Text }, (asyncResult) => {
      if (asyncResult.status === Office.AsyncResultStatus.Failed) {
        console.log(asyncResult.error.message);
        if (isClassic) {
          setClassicCopied(true);
        } else {
          setCopied(true);
        }
        setTimeout(() => {
          setCopied(false);
        }, 5000);
        return;
      }
    });
  };

  const onPrefillInfo = () => {
    console.log("Opening prefill info, current state:", {
      prefillInfo,
      selectedParticpant: selectedParticpant[0],
    });

    if (!prefillInfo) {
      setPrefillInfo({ firstName: "", lastName: "", email: "", phone: "", subject: "" });
    }

    if (selectedParticpant[0]) {
      const { firstName, lastName, email, source } = selectedParticpant[0];
      const phone = selectedParticpant[0].phone || selectedParticpant[0].phoneNumber || "";

      setPrefillInfo((prev) => ({
        ...prev,
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phone: phone,
        source: source || "",
      }));
    }
    setAddPrefillInfo(true);
  };

  const onAddAttendee = () => {
    setSelectedAttendee([{ email: "", firstName: "", lastName: "" }]);
    setAddAttendee(true);
  };

  const onAdd = () => {
    const temp = additionalAttendees;
    temp.push(selectedAttendee.pop());
    setAdditionalAttendees(temp);
    setAddAttendee(false);
  };

  const onRemove = () => {
    let newForms = [...additionalAttendees];
    newForms.pop();
    setAdditionalAttendees(newForms);
    setAddAttendee(false);
  };

  const onListRemove = (idx) => {
    let newForms = [...additionalAttendees];
    newForms.splice(idx, 1);
    setAdditionalAttendees(newForms);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    var fullUrl = generateURL(false);
    writeToEmail(fullUrl, false);
  };

  const handleClassicSubmit = (e) => {
    e.preventDefault();
    var fullUrl = generateURL(true);
    writeToEmail(fullUrl, true);
  };

  const aliasToNextGen = (url) => {
    return `https://use.confirmedapp.com/with/${url.substring(url.indexOf("calendar/") + 9, url.length)}`;
  };

  const handleEdit = (e) => {
    e.preventDefault();
    window.open(`https://use.confirmedapp.com/scheduler?flexcalid=${flexCal.lazyCalendarId}`);
  };

  const generateURL = (isClassic) => {
    var generatedUrl = isClassic ? flexCal.url : aliasToNextGen(flexCal.url);
    var attendeeEmails = [];
    var attendeeNames = [];

    for (let i = 0; i < additionalAttendees.length; i++) {
      attendeeEmails.push(additionalAttendees[i]["email"]);
      attendeeNames.push(additionalAttendees[i]["firstName"] + additionalAttendees[i]["lastName"]);
    }

    var lenE = attendeeEmails.length;
    var lenN = attendeeNames.length;

    if (lenE > 0) {
      generatedUrl += "?attendeeEmails=" + attendeeEmails.join(",");
    }

    if (lenN > 0 && attendeeNames.join("").length >= 1) {
      generatedUrl += "&";
      generatedUrl += "attendeeNames=" + attendeeNames.join(",");
    }

    if (prefillInfo) {
      if (prefillInfo.firstName) {
        generatedUrl.includes("?") ? (generatedUrl += "&firstName=") : (generatedUrl += "?firstName=");
        generatedUrl += encodeURIComponent(prefillInfo.firstName);
      }
      if (prefillInfo.lastName) {
        generatedUrl.includes("?") ? (generatedUrl += "&lastName=") : (generatedUrl += "?lastName=");
        generatedUrl += encodeURIComponent(prefillInfo.lastName);
      }
      if (prefillInfo.email) {
        generatedUrl.includes("?") ? (generatedUrl += "&email=") : (generatedUrl += "?email=");
        generatedUrl += encodeURIComponent(prefillInfo.email);
      }
      if (prefillInfo.phone) {
        generatedUrl.includes("?") ? (generatedUrl += "&phone=") : (generatedUrl += "?phone=");
        generatedUrl += encodeURIComponent(prefillInfo.phone);
      }
      if (prefillInfo.subject) {
        generatedUrl.includes("?") ? (generatedUrl += "&subject=") : (generatedUrl += "?subject=");
        const parsedSubject = encodeURIComponent(prefillInfo.subject).replace(/%20/g, "+");
        generatedUrl += parsedSubject;
      }
    }
    return generatedUrl;
  };

  const handleChange = (selected) => {
    if (selected.length > 0 && selected[0].phone) {
      setPrefillInfo((prev) => ({
        ...prev,
        phone: selected[0].phone,
      }));
    }
  };

  const info = () => {
    return (
      <div className="p-1">
        <Form.Group className="flex-row">
          <CPrefillField
            inputType={prefillInfoType.FirstName}
            contacts={contacts}
            prefillInfo={prefillInfo}
            setPrefillInfo={setPrefillInfo}
            selectedParticpant={selectedParticpant}
            setSelectedParticipant={setSelectedParticipant}
            optionClicked={participantOptionClicked}
            setOptionClicked={setParticipantOptionClicked}
          />
          <CPrefillField
            inputType={prefillInfoType.LastName}
            contacts={contacts}
            prefillInfo={prefillInfo}
            setPrefillInfo={setPrefillInfo}
            selectedParticpant={selectedParticpant}
            setSelectedParticipant={setSelectedParticipant}
            optionClicked={participantOptionClicked}
            setOptionClicked={setParticipantOptionClicked}
          />
        </Form.Group>
        <Form.Group className="flex-row">
          <CPrefillField
            inputType={prefillInfoType.Email}
            contacts={contacts}
            prefillInfo={prefillInfo}
            setPrefillInfo={setPrefillInfo}
            selectedParticpant={selectedParticpant}
            setSelectedParticipant={setSelectedParticipant}
            optionClicked={participantOptionClicked}
            setOptionClicked={setParticipantOptionClicked}
          />
          <CPrefillField
            inputType={prefillInfoType.Phone}
            contacts={contacts}
            prefillInfo={prefillInfo}
            setPrefillInfo={setPrefillInfo}
            selectedParticpant={selectedParticpant}
            setSelectedParticipant={setSelectedParticipant}
            optionClicked={participantOptionClicked}
            setOptionClicked={setParticipantOptionClicked}
          />
        </Form.Group>
        <Form.Group className="flex-row">
          <CPrefillField
            inputType={prefillInfoType.Subject}
            contacts={contacts}
            prefillInfo={prefillInfo}
            setPrefillInfo={setPrefillInfo}
            selectedParticpant={selectedParticpant}
            setSelectedParticipant={setSelectedParticipant}
            optionClicked={participantOptionClicked}
            setOptionClicked={setParticipantOptionClicked}
          />
        </Form.Group>
      </div>
    );
  };

  const newAttendee = (idx) => {
    return (
      <div className="p-1">
        <Form.Group className="mb-1" controlId="formBasicEmail" key={idx}>
          <CAdditionalAttendeeField
            inputType={attendeeInputType.Email}
            contacts={contacts}
            selectedAttendee={selectedAttendee}
            setSelectedAttendee={setSelectedAttendee}
            optionClicked={attendeeOptionClicked}
            setOptionClicked={setAttendeeOptionClicked}
          />
        </Form.Group>
        <Form.Group className="flexcal-form-name" key={idx}>
          <CAdditionalAttendeeField
            inputType={attendeeInputType.FirstName}
            contacts={contacts}
            selectedAttendee={selectedAttendee}
            setSelectedAttendee={setSelectedAttendee}
            optionClicked={attendeeOptionClicked}
            setOptionClicked={setAttendeeOptionClicked}
          />
          <CAdditionalAttendeeField
            inputType={attendeeInputType.LastName}
            contacts={contacts}
            selectedAttendee={selectedAttendee}
            setSelectedAttendee={setSelectedAttendee}
            optionClicked={attendeeOptionClicked}
            setOptionClicked={setAttendeeOptionClicked}
          />
        </Form.Group>
      </div>
    );
  };

  const showFlexCal = () => {
    window.open(generateURL(false));
  };

  const showClassicFlexCal = () => {
    window.open(generateURL(true));
  };

  const formatDate = (date) => {
    const split = date.split("T")[0];
    return new Date(split).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="card">
      <Card.Body>
        <Card.Title>{flexCal.name} </Card.Title>
        {!flexCal.evergreen && (
          <Card.Subtitle className="text-muted">
            {formatDate(flexCal.startDate) + " - " + formatDate(flexCal.endDate)}
          </Card.Subtitle>
        )}
        <Form onSubmit={handleSubmit}>
          {!addPrefillInfo && prefillInfo && (
            <Container>
              <p className="fw-bold">Participant Info:</p>
              <div>
                {prefillInfo.firstName && (
                  <div className="flex-row">
                    <p>First Name: </p>
                    <div className="d-flex align-items-center">
                      {getSourceIcon(prefillInfo.source)}
                      <p className="fw-bold ms-1">{prefillInfo.firstName}</p>
                    </div>
                  </div>
                )}
                {prefillInfo.lastName && (
                  <div className="flex-row">
                    <p>Last Name: </p>
                    <div className="d-flex align-items-center">
                      {getSourceIcon(prefillInfo.source)}
                      <p className="fw-bold ms-1">{prefillInfo.lastName}</p>
                    </div>
                  </div>
                )}
                {prefillInfo.email && (
                  <div className="flex-row">
                    <p>Email: </p>
                    <div className="d-flex align-items-center">
                      {getSourceIcon(prefillInfo.source)}
                      <p className="fw-bold truncate ms-1">{prefillInfo.email}</p>
                    </div>
                  </div>
                )}
                {prefillInfo.phone && (
                  <div className="flex-row">
                    <p>Phone: </p>
                    <p className="fw-bold">{prefillInfo.phone}</p>
                  </div>
                )}
                {prefillInfo.subject && (
                  <div className="flex-row">
                    <p>Subject: </p>
                    <p className="fw-bold truncate">{prefillInfo.subject}</p>
                  </div>
                )}
              </div>
            </Container>
          )}
          {addPrefillInfo && (
            <div>
              {info()}
              <Button
                className="flexcal-add-btn"
                variant="light"
                onClick={() => {
                  console.log("Done clicked, current state:", {
                    prefillInfo,
                    selectedParticpant: selectedParticpant[0],
                  });

                  const updatedInfo = {
                    firstName: selectedParticpant[0]?.firstName || prefillInfo?.firstName || "",
                    lastName: selectedParticpant[0]?.lastName || prefillInfo?.lastName || "",
                    email: selectedParticpant[0]?.email || prefillInfo?.email || "",
                    phone: selectedParticpant[0]?.phone || selectedParticpant[0]?.phoneNumber || prefillInfo?.phone || "",
                    subject: prefillInfo?.subject || "",
                    source: selectedParticpant[0]?.source || prefillInfo?.source || "",
                  };
                  console.log("Setting prefillInfo to:", updatedInfo);

                  setPrefillInfo(updatedInfo);
                  setParticipantOptionClicked(false);
                  setAddPrefillInfo(false);
                }}
                size="sm"
              >
                Done <MdDone />
              </Button>
              <Button
                className="flexcal-remove-btn"
                variant="light"
                onClick={() => {
                  setPrefillInfo(undefined);
                  setParticipantOptionClicked(false);
                  setSelectedParticipant([{ email: "", firstName: "", lastName: "" }]);
                  setAddPrefillInfo(false);
                }}
                size="sm"
              >
                Clear <MdOutlineClear />
              </Button>
            </div>
          )}
          {!addAttendee && (
            <Container className="pt-2">
              {additionalAttendees.length > 0 && <p className="fw-bold">Additional Attendees:</p>}
              {additionalAttendees.map((attendee, idx) => (
                <Row key={idx}>
                  {attendee.firstName ? (
                    <Col xs={9}>
                      <OverlayTrigger placement="top" overlay={<Tooltip>{attendee.email}</Tooltip>}>
                        <p className="fw-bold">{attendee.firstName + " " + attendee.lastName}</p>
                      </OverlayTrigger>
                    </Col>
                  ) : (
                    <Col xs={9}>
                      <p className="fw-bold">{attendee.email}</p>
                    </Col>
                  )}
                  <Col xs={1}>
                    <MdRemoveCircleOutline
                      className="flexcal-remove-icon"
                      size={22}
                      onClick={() => onListRemove(idx)}
                    />
                  </Col>
                </Row>
              ))}
              <div className="flex-row">
                <Button className="flexcal-add-btn" variant="light" onClick={onPrefillInfo} size="sm">
                  Prefill Info <MdPlaylistAdd />
                </Button>
                <Button className="flexcal-add-btn" variant="light" onClick={onAddAttendee} size="sm">
                  Add Attendee <MdGroupAdd />
                </Button>
              </div>
            </Container>
          )}
          {addAttendee && (
            <div>
              {newAttendee(additionalAttendees.length - 1)}
              <div>
                <Button className="flexcal-add-btn" variant="light" onClick={onAdd} size="sm">
                  Add <MdAdd />
                </Button>
                <Button className="flexcal-remove-btn" variant="light" onClick={onRemove} size="sm">
                  Remove <MdRemove />
                </Button>
              </div>
            </div>
          )}
          <div>
            <div className="button-group">
              <OverlayTrigger placement="top" overlay={<Tooltip>Next Gen</Tooltip>}>
                <img className="logo-image" src="./../../../../assets/logo192.png" alt="Confrmed Next Gen logo" />
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Open new browser tab with this Scheduling page</Tooltip>}
              >
                <Button
                  onClick={showFlexCal}
                  size="sm"
                  className={`primary-btn ${flexCal.evergreen ? "next-gen-flex-btn" : "flex-btn"}`}
                >
                  Show <MdOpenInNew></MdOpenInNew>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={<Tooltip>Insert scheduling link at the position of your cursor</Tooltip>}>
                <Button
                  id="flexcal-copy-btn"
                  onClick={handleSubmit}
                  size="sm"
                  type="submit"
                  disabled={addAttendee || !isComposeMode}
                  className={`primary-btn ${flexCal.evergreen ? "next-gen-flex-btn" : "flex-btn"}`}
                >
                  Insert <FiCopy></FiCopy>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Change the options I allow when people schedule with this link</Tooltip>}
              >
                <Button size="sm" className="primary-btn next-gen-flex-btn" onClick={handleEdit}>
                  Edit <FiEdit />
                </Button>
              </OverlayTrigger>
            </div>
            {copied ? "Copied!" : null}
          </div>
          <div>
            <div className="button-group">
              <OverlayTrigger placement="top" overlay={<Tooltip>Classic</Tooltip>}>
                <img
                  className="logo-image"
                  src="./../../../../assets/classic-logo192.png"
                  alt="Confrmed Classic logo"
                />
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    Open new browser tab with this Scheduling page including A.I. powered travel optimization
                  </Tooltip>
                }
              >
                <Button onClick={showClassicFlexCal} size="sm" className="primary-btn-classic flex-btn">
                  Show <MdOpenInNew></MdOpenInNew>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={<Tooltip>Insert scheduling link at the position of your cursor</Tooltip>}>
                <Button
                  id="flexcal-copy-btn"
                  onClick={handleClassicSubmit}
                  size="sm"
                  type="submit"
                  disabled={addAttendee || !isComposeMode}
                  className="primary-btn-classic flex-btn"
                >
                  Insert <FiCopy></FiCopy>
                </Button>
              </OverlayTrigger>
            </div>
            {classicCopied ? "Copied!" : null}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CFlexCalCard;

