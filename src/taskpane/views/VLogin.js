import { Col, Container, Row, Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import showLoginPopup from "../helpers/showLoginPopup";
import getBaseUrl from "../helpers/getBaseUrl";
import YoutubeEmbed from "../components/common/CYoutubeEmbed";
import { FaRobot } from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { AiFillCustomerService } from "react-icons/ai";
import { IoMdStats } from "react-icons/io";
import { LoginType } from "../helpers/enums";
import { useState, useEffect } from "react";
import { getManifestVersion } from "../services/ManifestService";
import RegisterService from "../services/RegisterService";

/**
 * Login Component which prompts users with a popup window
 * to sign in with username and password
 * @param {*} props popup component from Auth0
 */
export default function Login(props) {
  const { setAccessToken, setTokenExpiresAt } = props;
  const [version, setVersion] = useState("Loading...");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const baseUrl = getBaseUrl();

  useEffect(() => {
    // Fetch the version when component mounts
    getManifestVersion().then(ver => setVersion(ver));
  }, []);

  const handleLoginSuccess = async (updaterOrValue) => {
    let newTokenState = {};
    if (typeof updaterOrValue === 'function') {
      newTokenState = updaterOrValue({});
    } else {
      newTokenState = updaterOrValue;
    }

    const accessToken = newTokenState.access_token;

    if (!accessToken) {
      setAccessToken(updaterOrValue);
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await RegisterService.checkSubscriberExists(accessToken);
      const data = await response.json();


      if (response.status === 200 && data.subscriberExists === true) {
        setAccessToken(updaterOrValue);
      } else {
        if (props.setView) {
          let email = "";

          const tokenState = typeof updaterOrValue === 'function' ? updaterOrValue({}) : updaterOrValue;
          const idToken = tokenState.id_token;

          if (idToken) {
            const decodedId = RegisterService.decodeToken(idToken);
            if (decodedId) {
              email = decodedId.email || "";
            }
          }

          if (!email) {
            const decodedAccess = RegisterService.decodeToken(accessToken);
            email = decodedAccess?.email || "";
          }

          props.setView('signup', {
            accessToken,
            email,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
          });
        }
      }
    } catch (error) {
      console.error("Error checking subscriber on login:", error);
      alert("Error verification failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignupSuccess = async (accessToken, expiresIn, emailFromToken) => {
    setIsLoggingIn(true);

    try {
      const response = await RegisterService.checkSubscriberExists(accessToken);

      const data = await response.json();

      if (response.status === 200 && data.subscriberExists === true) {
        setAccessToken({ access_token: accessToken });

        const expiresAt = expiresIn ? (Date.now() + expiresIn * 1000) : (Date.now() + 24 * 60 * 60 * 1000);
        setTokenExpiresAt({ token_expires_at: expiresAt });
      } else {

        if (props.setView) {

          let decoded = null;
          let email = emailFromToken || "";
          let firstName = "";
          let lastName = "";

          if (!email) {
            decoded = RegisterService.decodeToken(accessToken);
            email = decoded?.email || "";
            firstName = decoded?.given_name || "";
            lastName = decoded?.family_name || "";
          } else {
            decoded = RegisterService.decodeToken(accessToken);
            firstName = decoded?.given_name || "";
            lastName = decoded?.family_name || "";
          }

          const finalFirstName = data.firstName || firstName;
          const finalLastName = data.lastName || lastName;

          props.setView('signup', {
            accessToken,
            email,
            firstName: finalFirstName,
            lastName: finalLastName,
            expiresIn
          });
        }
      }
    } catch (error) {
      console.error("Error in signup interceptor:", error);
      alert("Error checking account status. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignInClick = () => {
    setIsLoggingIn(true);
    showLoginPopup(
      LoginType.CONFIRMED,
      handleLoginSuccess,
      setTokenExpiresAt,
      null,
      null,
      null,
      null,
      null,
      () => setIsLoggingIn(false)
    );
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    setIsSigningUp(true);
    showLoginPopup(
      LoginType.SIGNUP,
      () => { },
      setTokenExpiresAt,
      null,
      null,
      null,
      null,
      handleSignupSuccess,
      () => setIsSigningUp(false)
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <Container>
        <Row className="justify-content-md-center pt-2 pb-4">
          <Col lg={3}>
            <Image fluid={true} src="./../../../assets/logo512.png"></Image>
          </Col>
        </Row>
        <Row>
          <Col>
            <YoutubeEmbed embedId={"UV46mt-Y8g8"} />
          </Col>
        </Row>
        <Row className="pt-4">
          <Col>
            <ul className="left-justify-list">
              <li className="list-item">
                <MdMeetingRoom style={{ marginRight: "16px", color: "#41978F" }} size={25} /> Set
                meeting request guidelines
              </li>
              <li className="list-item">
                <FaRobot style={{ marginRight: "16px", color: "#41978F" }} size={25} /> A.I.
                optimized travel
              </li>
              <li className="list-item">
                <AiFillCustomerService
                  style={{ marginRight: "16px", color: "#41978F" }}
                  size={25}
                />{" "}
                Automated CRM logging
              </li>
              <li className="list-item">
                <IoMdStats style={{ marginRight: "16px", color: "#41978F" }} size={25} /> Robust
                data & reports
              </li>
            </ul>
          </Col>
        </Row>
        <Row className="justify-content-md-center pt-1 pb-3">
          <Col xs lg="3">
            <Button
              variant="primary"
              style={{ width: "100%" }}
              className="primary-btn"
              onClick={handleSignInClick}
              id="sign-in-button"
              disabled={isLoggingIn || isSigningUp}
            >
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>
          </Col>
        </Row>
        <Row className="justify-content-md-center">
          <Col xs lg="6" className="text-center">
            <div>
              Don't have an account?{"   "}
              <a
                href="#"
                onClick={handleSignupClick}
              >
                Sign Up
              </a>
              .
            </div>
          </Col>
        </Row>
        <Row className="justify-content-md-center mt-3">
          <Col xs lg="6" className="text-center">
            <small className="text-muted">Version {version}</small>
          </Col>
        </Row>
        {/*TODO: Reimplement when we find a way to dynamically pull client version from manifest*/}
        {/* <Row>
          <Col>
            <iframe
              title="iframe_login"
              id="iframe_login"
              src=`${under_login_image_url}`
              style={{
                height: "1000px",
                width: "100%",
                top: "0px",
                right: "0px",
              }}
            ></iframe>
          </Col>
        </Row> */}
      </Container>
    </div>
  );
}
