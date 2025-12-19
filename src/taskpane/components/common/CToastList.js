import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { ToastType } from "../../helpers/enums";

const CToastList = ({ toasts, setToasts }) => {
  const getBackgroundColor = (type) => {
    if (type === ToastType.SUCCESS) {
      return "success";
    } else if (type === ToastType.WARNING) {
      return "warning";
    } else {
      return "danger";
    }
  };

  const getTextColor = (type) => {
    if (type === ToastType.SUCCESS) {
      return "white";
    } else {
      return "black";
    }
  };

  const handleClose = (id) => {
    const updatedToasts = toasts.filter((toast) => toast.id !== id);
    setToasts(updatedToasts);
  };

  return (
    <ToastContainer className="position-fixed bottom-0 end-0 m-3">
      {toasts.map((toast) => {
        const isWarningToast = toast.type === ToastType.WARNING;
        const autohide = !isWarningToast;
        const delayDuration = 6000;
        
        return (
          <Toast
            key={toast.id}
            onClose={() => handleClose(toast.id)}
            show={true}
            delay={autohide ? delayDuration : undefined}
            autohide={autohide}
            bg={getBackgroundColor(toast.type)}
            text="light"
            style={{ width: "18rem" }}
          >
            <Toast.Header closeButton={true}>
              <strong className="me-auto">{toast.type}</strong>
            </Toast.Header>
            <Toast.Body style={{ color: getTextColor(toast.type) }}>
              {toast.message}
            </Toast.Body>
          </Toast>
        );
      })}
    </ToastContainer>
  );
};

export default CToastList;
