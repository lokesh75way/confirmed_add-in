import { Col, Container, Row, Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { useState, useEffect } from "react";
import getBaseUrl from "../helpers/getBaseUrl";
import TimezoneSelect from 'react-timezone-select';
import RegisterService from "../services/RegisterService";

/**
 * Profile Component
 * @param {*} props 
 */
export default function VSignup(props) {
    const { setAccessToken, setTokenExpiresAt, setView, accessToken, email, firstName, lastName, expiresIn } = props;
    const baseUrl = getBaseUrl();

    const [selectedTimezone, setSelectedTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    const [formData, setFormData] = useState({
        FirstName: firstName || "",
        LastName: lastName || "",
        EmailAddress: email || ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            FirstName: firstName || prev.FirstName,
            LastName: lastName || prev.LastName,
            EmailAddress: email || prev.EmailAddress
        }));
    }, [firstName, lastName, email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTimezoneChange = (tz) => {
        setSelectedTimezone(tz);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let timezoneValue = selectedTimezone;
        if (selectedTimezone && typeof selectedTimezone === 'object' && 'value' in selectedTimezone) {
            timezoneValue = selectedTimezone.value;
        }

        const registrationData = {
            ...formData,
            TimeZone: timezoneValue
        };

        if (accessToken) {
            const decoded = RegisterService.decodeToken(accessToken);
            if (decoded && decoded.sub) {
                const parts = decoded.sub.split('|');
                if (parts.length > 1) {
                    registrationData.UserName = parts[1];
                } else {
                    registrationData.UserName = decoded.sub;
                }
            }
        }

        if (!registrationData.UserName) {
            setIsSubmitting(false);
            throw new Error('UserName could not be resolved from access token');
        }

        try {
            if (!accessToken) {
                alert("Session expired. Please sign in again.");
                if (setView) setView('login');
                setIsSubmitting(false);
                return;
            }

            console.log("Submitting registration with existing token...");
            await RegisterService.createAccount(accessToken, registrationData);

            console.log("Registration successful. Logging in...");
            setAccessToken({ access_token: accessToken });

            const expiresAt = expiresIn ? (Date.now() + expiresIn * 1000) : (Date.now() + 24 * 60 * 60 * 1000);
            setTokenExpiresAt({ token_expires_at: expiresAt });

        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <Container>
                <Row>
                    <Col className="text-center">
                        <h3 style={{ color: "#41978f", marginBottom: "30px" }}>Profile</h3>
                    </Col>
                </Row>

                <Row className="justify-content-md-center">
                    <Col xs lg="8">
                        <form onSubmit={handleSubmit}>
                            <div className="field-wrapper">
                                <label className="field-label">First Name
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="FirstName"
                                    className="field-input"
                                    value={formData.FirstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-wrapper">
                                <label className="field-label">Last Name
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="LastName"
                                    className="field-input"
                                    value={formData.LastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-wrapper" style={{ display: 'none' }}>
                                <label className="field-label">Email Address
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="hidden"
                                    name="EmailAddress"
                                    className="field-input"
                                    value={formData.EmailAddress}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                                <label
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        marginBottom: '4px',
                                        display: 'block'
                                    }}
                                >
                                    Time Zone
                                    <span className="required">*</span>
                                </label>

                                <TimezoneSelect
                                    value={selectedTimezone}
                                    onChange={handleTimezoneChange}
                                    className="timezone-select-container"
                                    classNamePrefix="timezone-select"
                                />
                            </div>

                            <Button
                                variant="primary"
                                type="submit"
                                style={{ width: "100%", marginTop: "10px" }}
                                className="primary-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        Completing Profile... <Spinner animation="border" size="sm" style={{ marginLeft: ".5rem" }} />
                                    </>
                                ) : (
                                    "Complete Profile"
                                )}
                            </Button>
                        </form>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
