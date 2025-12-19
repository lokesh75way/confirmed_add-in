import React, { useEffect, useState, useRef } from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import CToastList from "../common/CToastList";
import { Spinner } from "react-bootstrap";
import recordEmailAsTask from "../../services/RecordEmailAsTask";
import { SiSalesforce } from "react-icons/si";
import { IoMdDoneAll } from "react-icons/io";
import CSalesforceLogout from "./CSalesforceLogout";
import { ToastType } from "../../helpers/enums";
import parseDateTime from "../../helpers/parseDateTime";

const CLogRecord = ({ sfAccessToken, setSfAccessToken, setIsSalesforceConnected, accessToken }) => {
  const OFFICE = window.Office;

  const [emailItems, setEmailItems] = useState([]);
  const [currentOfficeItem, setCurrentOfficeItem] = useState(OFFICE.context.mailbox.item);
  const [isLogging, setIsLogging] = useState(false);
  const [toasts, setToasts] = useState([]);
  const openedEditPages = useRef({}); // Ref to track opened edit pages

  // Implement OfficeJS Outlook event handler mechanism
  useEffect(() => {
    const itemChangedHandler = async (event) => {
      try {
        // Get the current item
        setCurrentOfficeItem(OFFICE.context.mailbox.item);
      } catch (error) {
        console.error("Error handling item changed event:", error);
      }
    };

    // Register the ItemChanged event handler
    OFFICE.context.mailbox.addHandlerAsync(OFFICE.EventType.ItemChanged, itemChangedHandler, (result) => {
      if (result.status === OFFICE.AsyncResultStatus.Succeeded) {
        console.log("ItemChanged event handler added successfully");
      } else {
        console.error("Failed to add ItemChanged event handler", result.error);
      }
    });

    // Cleanup: Remove the event handler when the component is unmounted
    return () => {
      OFFICE.context.mailbox.removeHandlerAsync(OFFICE.EventType.ItemChanged, (result) => {
        if (result.status === OFFICE.AsyncResultStatus.Succeeded) {
          console.log("ItemChanged event handler removed successfully");
        } else {
          console.error("Failed to remove ItemChanged event handler", result.error);
        }
      });
    };
  }, []);

  // Set email item data when a new Outlook item is selected
  useEffect(() => {
    const setData = async () => {
      try {
        // Access the email item
        const mailItem = OFFICE.context.mailbox.item;

        // Check to see if the user is the sender of the email message
        const senderEmailAddress = OFFICE.context.mailbox.item.sender.emailAddress.toLowerCase();
        const userProfileEmailAddress = OFFICE.context.mailbox.userProfile.emailAddress.toLowerCase();
        const isUserSender = senderEmailAddress && senderEmailAddress === userProfileEmailAddress;

        // Get relevant email properties
        const id = mailItem.itemId;
        const name = isUserSender ? mailItem.to[0].displayName : mailItem.sender.displayName;
        const address = isUserSender ? mailItem.to[0].emailAddress : mailItem.sender.emailAddress;
        const cc = mailItem.cc;
        const bcc = mailItem.bcc;
        const subject = mailItem.subject;
        const messageDate = mailItem.dateTimeCreated.toISOString();

        // Get message body as text asynchronously
        const body = await new Promise((resolve, reject) => {
          mailItem.body.getAsync(OFFICE.CoercionType.Text, function (result) {
            if (result.status === OFFICE.AsyncResultStatus.Succeeded) {
              resolve(result.value);
            } else {
              reject(result.error.message);
            }
          });
        });

        const isLogged = false;

        setEmailItems((prevItems) => {
          const isDuplicate = prevItems.some((item) => item.id === id);
          if (isDuplicate) {
            return prevItems;
          }
          return [
            ...prevItems,
            { id, name, address, cc, bcc, subject, messageDate, body, isLogged },
          ];
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    setData();
  }, [currentOfficeItem]);

  const salesforceColor = getComputedStyle(document.documentElement).getPropertyValue("--salesforce");
  // Added logged color (green) for completed tasks
  const loggedColor = "#28a745";

  const addToast = (id, type, message) => {
    const newToast = { id, type, message };
    setToasts((prevToasts) => [...prevToasts, newToast]);
  };


  const handleLeadEditRedirect = (url, email, id) => {
    if (url) {
      const contactKey = `${email.name}|${email.address}`.toLowerCase();

      if (!openedEditPages.current[contactKey]) {
        if (Office.context.ui && Office.context.ui.openBrowserWindow) {
          Office.context.ui.openBrowserWindow(url);
        } else {
          const win = window.open(url, '_blank', 'noopener,noreferrer');
          if (!win || win.closed || typeof win.closed == 'undefined') {
            addToast(id, ToastType.WARNING, "Popup blocked! Please allow popups for this site.");
          }
        }

        openedEditPages.current[contactKey] = true;
        addToast(
          id,
          ToastType.WARNING,
          <>
            No Contact or Lead exists for {email.address}. A lead edit page has been opened. Remember to come back and enter the activity after you save the lead record.
          </>
        );
      } else {
        addToast(
          id,
          ToastType.WARNING,
          <>
            No Contact or Lead exists for {email.address}. A lead edit page was already opened for this contact. Remember to come back and enter the activity after you save the lead record.
          </>
        );
      }
    } else {
      addToast(id, ToastType.ERROR, "Could not open Salesforce Lead creation page: Missing instance URL.");
    }
  };

  const logToSalesforce = async (id) => {
    setIsLogging(true);
    const email = emailItems.find((e) => e.id === id);
    try {
      console.log("Email", email);
      const response = await recordEmailAsTask(email);
      if (response.status === 200) {
        addToast(id, ToastType.SUCCESS, `Email '${email.subject}' recorded successfully`);
        setEmailItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, isLogged: true } : item)));

      } else if (response.status === 404) {
        const data = await response.json();
        if (data.redirectUrl) {
          handleLeadEditRedirect(data.redirectUrl, email, id);
        } else {
          addToast("No Lead or Contact found.");
        }

      } else {
        addToast(id, ToastType.ERROR, `Error recording: status ${response.status}`);
      }

    } catch (error) {
      console.error("Error logging to salesforce:", error);
      addToast(id, ToastType.ERROR, `Error recording: ${error.message}`);
    } finally {
      setIsLogging(false);
    }
  };

  const logAllToSalesforce = async () => {
    setIsLogging(true);
    const emails = emailItems.filter((e) => !e.isLogged);
    for (const email of emails) {
      try {
        const response = await recordEmailAsTask(email);
        if (response.status === 200) {
          addToast(email.id, ToastType.SUCCESS, `Email '${email.subject}' recorded successfully`);
          setEmailItems((prevItems) => prevItems.map((item) => (item.id === email.id ? { ...item, isLogged: true } : item)));

        } else if (response.status === 404) {
          const data = await response.json();
          if (data.redirectUrl) {
            handleLeadEditRedirect(data.redirectUrl, email, email.id);
          } else {
            addToast("No Lead or Contact found.");
          }
        } else {
          addToast(email.id, ToastType.ERROR, `Error recording: status ${response.status}`);
        }
      } catch (error) {
        console.error(error);
        addToast(email.id, ToastType.ERROR, `Error recording: ${error.message}`);
      }
    }
    setIsLogging(false); // Set loading state back to false when the operation is done
  };

  // "Enter all activities" button appearance logic

  const isAllLogged = emailItems.every((e) => e.isLogged);
  const getButtonLabel = () => {
    if (isAllLogged) return "All Activities Logged";
    if (isLogging) return "Entering All Activities...";
    return "Enter All Activities";
  };
  const IconComponent = isAllLogged ? IoMdDoneAll : SiSalesforce;

  return (
    <>
      <Button
        onClick={logAllToSalesforce}
        disabled={isAllLogged}
        style={{
          width: "90%",
          backgroundColor: isAllLogged ? loggedColor : salesforceColor,
          borderColor: isAllLogged ? loggedColor : salesforceColor,
        }}
      >
        <IconComponent style={{ marginRight: ".5rem" }} />
        {getButtonLabel()}
        {isLogging && <Spinner animation="border" size="sm" style={{ marginLeft: ".5rem" }} />}
      </Button>
      {emailItems.length > 0 ? (
        emailItems.map((emailItem, index) => (
          <Card key={index} style={{ width: "18rem", height: "100%" }}>
            <Card.Header>{emailItem.name}</Card.Header>
            <ListGroup>
              <ListGroup.Item style={{ fontSize: "0.8rem" }}>{emailItem.address}</ListGroup.Item>
              <ListGroup.Item>{emailItem.subject}</ListGroup.Item>
              <ListGroup.Item>{parseDateTime(emailItem.messageDate)}</ListGroup.Item>
              <ListGroup.Item>
                <Button
                  style={{
                    backgroundColor: emailItem.isLogged ? loggedColor : salesforceColor,
                    borderColor: emailItem.isLogged ? loggedColor : salesforceColor,
                  }}
                  onClick={() => logToSalesforce(emailItem.id)}
                  disabled={emailItem.isLogged}
                >
                  {emailItem.isLogged ? (
                    <>
                      <IoMdDoneAll style={{ marginRight: ".5rem" }} /> Activity Entered
                    </>
                  ) : (
                    <>
                      <SiSalesforce style={{ marginRight: ".5rem" }} /> Enter Activity
                    </>
                  )}
                  {isLogging && <Spinner animation="border" size="sm" style={{ marginLeft: ".5rem" }} />}
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        ))
      ) : (
        <p>Open up an Outlook message to get started</p>
      )}
      <CSalesforceLogout setSfAccessToken={setSfAccessToken} setIsSalesforceConnected={setIsSalesforceConnected} accessToken={accessToken} />
      {<CToastList toasts={toasts} setToasts={setToasts} />}
    </>
  );
};

export default CLogRecord;
