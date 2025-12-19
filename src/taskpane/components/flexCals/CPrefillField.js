import { useEffect, useState } from "react";
import { Typeahead, Menu, MenuItem } from "react-bootstrap-typeahead";
import { prefillInfoType } from "../../constants/Variables";
import { Form } from "react-bootstrap";
import { FaUserAlt, FaCalendarAlt } from "react-icons/fa";
import { SiSalesforce } from "react-icons/si";

const CPrefillField = ({
  inputType,
  contacts,
  prefillInfo,
  setPrefillInfo,
  selectedParticpant,
  setSelectedParticipant,
  optionClicked,
  setOptionClicked,
}) => {
  // Track focus state to apply highlight styling
  const [isFocused, setIsFocused] = useState(false);

  // Add debugging to see what's happening
  useEffect(() => {
    if (contacts && contacts.length > 0) {
      console.log(`CPrefillField ${inputType.description}: Received ${contacts.length} contacts`);
    }
  }, [contacts, inputType.description]);

  const handleInputChange = (text) => {
    const updatedParticipant = [...selectedParticpant];
    switch (inputType) {
      case prefillInfoType.FirstName:
        updatedParticipant[0] = { ...updatedParticipant[0], firstName: text };
        return setSelectedParticipant(updatedParticipant);
      case prefillInfoType.LastName:
        updatedParticipant[0] = { ...updatedParticipant[0], lastName: text };
        return setSelectedParticipant(updatedParticipant);
      case prefillInfoType.Email:
        updatedParticipant[0] = { ...updatedParticipant[0], email: text };
        return setSelectedParticipant(updatedParticipant);
      case prefillInfoType.Phone:
        // Update prefillInfo directly for phone
        return setPrefillInfo(prev => ({ ...prev, phone: text }));
      default:
        return setPrefillInfo(prev => ({ ...prev, subject: text }));
    }
  };

  const handleChange = (selected) => {
    // This function is triggered both by clicking and pressing Enter
    if (selected.length > 0) {
      console.log("Contact selected:", selected[0]);
      
      // Ensure we preserve the phone number and source when selecting a contact
      const selectedContact = selected[0];
      const phone = selectedContact.phone || selectedContact.phoneNumber || "";
      const source = selectedContact.source || "";
      
      // Update the participant with all fields including phone and source
      const updatedContact = {
        ...selectedContact,
        phone: phone,
        source: source
      };
      
      // Reset selected participant with only the new contact data
      setSelectedParticipant([updatedContact]);
      
      // Also update prefillInfo with this contact's data
      if (inputType === prefillInfoType.FirstName || 
          inputType === prefillInfoType.LastName || 
          inputType === prefillInfoType.Email) {
        
        // IMPORTANT: Completely reset all fields first before setting new values
        // This ensures old values are completely cleared when a new contact is selected
        setPrefillInfo({
          firstName: updatedContact.firstName || "",
          lastName: updatedContact.lastName || "",
          email: updatedContact.email || "",
          phone: phone || "",
          subject: prefillInfo?.subject || "", // Preserve subject as it's unrelated to contact selection
          source: source || ""
        });
      }
      
      // Set option clicked to true to ensure the selection is processed correctly
      setOptionClicked(true);
      // Then reset it back to false after a small delay to prepare for the next selection
      setTimeout(() => {
        setOptionClicked(false);
      }, 100);
    }
  };

  const getLabel = () => {
    switch (inputType) {
      case prefillInfoType.FirstName:
        return "First Name";
      case prefillInfoType.LastName:
        return "Last Name";
      case prefillInfoType.Email:
        return "Email";
      case prefillInfoType.Phone:
        return "Phone";
      default:
        return "Subject";
    }
  };

  // Modified to provide a default display text if the primary field is missing
  const getOptionType = (option) => {
    switch (inputType) {
      case prefillInfoType.Email:
        return option.email || "";
      case prefillInfoType.FirstName:
        return option.firstName || "";
      default:
        return option.lastName || "";
    }
  };

  const getFieldType = () => {
    switch (inputType) {
      case prefillInfoType.Email:
        return "email";
      case prefillInfoType.Phone:
        return "tel";
      default:
        return "text";
    }
  };

  const isLookAhead = () => {
    if (inputType === prefillInfoType.Email || inputType === prefillInfoType.FirstName || inputType === prefillInfoType.LastName) return true;
    return false;
  };

  /**
   * Get the current value for the field based on inputType
   * @returns {string} The current value for the field
   */
  const getValue = () => {
    if (!prefillInfo) return "";
    
    switch (inputType) {
      case prefillInfoType.FirstName:
        return prefillInfo.firstName || "";
      case prefillInfoType.LastName:
        return prefillInfo.lastName || "";
      case prefillInfoType.Email:
        return prefillInfo.email || "";
      case prefillInfoType.Phone:
        return prefillInfo.phone || "";
      case prefillInfoType.Subject:
        return prefillInfo.subject || "";
      default:
        return "";
    }
  };
  
  // Determine dropdown width based on field type
  const getDropdownWidth = () => {
    switch (inputType) {
      case prefillInfoType.FirstName:
      case prefillInfoType.LastName:
        return "calc(200% + 8px)"; // Double width plus gap
      case prefillInfoType.Email:
      case prefillInfoType.Phone:
        return "calc(200% + 8px)"; // Double width plus gap
      default:
        return "100%"; // Default width
    }
  };
  
  // Get dropdown positioning style based on field type
  const getDropdownPositionStyle = () => {
    if (inputType === prefillInfoType.LastName) {
      // For lastName, position left edge aligned with firstName field
      return { 
        left: "calc(-100% - 5px)",  // Move left by width of field + gap
        right: "auto" 
      };
    }
    return {}; // Default positioning for other fields
  };
  
  // Get highlight class based on field type and focus state
  const getHighlightClass = () => {
    if (!isFocused) return "";
    
    switch (inputType) {
      case prefillInfoType.FirstName:
        return "highlight-firstname";
      case prefillInfoType.LastName:
        return "highlight-lastname";
      case prefillInfoType.Email:
        return "highlight-email";
      case prefillInfoType.Phone:
        return "highlight-phone";
      case prefillInfoType.Subject:
        return "highlight-subject";
      default:
        return "";
    }
  };

  /**
   * Format phone number for display if it exists
   * @param {string} phone The phone number to format
   * @returns {string} Formatted phone number display text or empty string
   */
  const getPhoneDisplay = (phone) => {
    if (!phone) return "";
    return ` • ${phone}`;
  };

  // Add function to get source icon
  const getSourceIcon = (source) => {
    // Handle undefined, null, or empty string sources
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

  // This is to force meeting contacts first, external second, then salesforce third
  const getSourcePriority = (contact) => {
    if (contact && contact.source) {
      const s = contact.source.toLowerCase();
      if (s === 'meeting') return 1;
      if (s === 'external') return 2;
      if (s.includes('salesforce')) return 3;
    }
    return 4;
  };

  // Update getSortedContacts to sort by source priority
  const getSortedContacts = () => {
    return contacts ? [...contacts].sort((a, b) => getSourcePriority(a) - getSourcePriority(b)) : [];
  };

  return (
    <>
      {
        isLookAhead() ? (
          <div className={`typeahead-container ${getHighlightClass()}`} style={{ position: "relative" }}>
            <Typeahead
              size="sm"
              type={getFieldType()}
              labelKey={(option) => `${getOptionType(option)}`}
              placeholder={getLabel()}
              required
              validated
              options={getSortedContacts() || []}
              selected={selectedParticpant}
              onChange={(selected) => handleChange(selected)}
              onInputChange={(text) => handleInputChange(text)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              // Enhance keyboard behavior to ensure Enter selects the highlighted item
              selectHintOnEnter={true}
              // Ensure the Typeahead commits the selection immediately
              minLength={0}
              // Allow keyboard navigation within the dropdown
              highlightOnlyResult={true}
              // Add key handlers to improve keyboard selection
              onKeyDown={(e) => {
                // If user presses Enter and there's an actively highlighted item, ensure it gets selected
                if (e.key === 'Enter' && e.target.value) {
                  // The Typeahead component will handle the selection via onChange
                  setOptionClicked(true);
                }
              }}
              renderMenu={(results, menuProps) => {
                // Filter out null values
                const filteredResults = results.filter(
                  (result) => getOptionType(result) !== null
                );
                // Hide the menu when there are no results.
                if (!filteredResults.length) {
                  return null;
                }

                return (
                  <Menu
                    {...menuProps}
                    onClick={() => setOptionClicked(true)}
                    style={{ 
                      maxHeight: "250px", 
                      overflow: "auto",
                      width: getDropdownWidth(),
                      zIndex: 1050,
                      boxShadow: "0 6px 12px rgba(0,0,0,.175)",
                      position: "absolute",
                      ...getDropdownPositionStyle() // Apply position adjustment
                    }}
                    className={inputType === prefillInfoType.LastName ? 'lastname-dropdown' : ''}
                  >
                    {filteredResults.map((result, index) => (
                      <MenuItem 
                        key={index} 
                        option={result} 
                        position={index}
                        className="dropdown-item"
                      >
                        {inputType === prefillInfoType.FirstName ? (
                          // Format for FirstName field with icon
                          <div className="dropdown-content">
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                              <span style={{ marginRight: "5px" }}>{getSourceIcon(result.source)}</span>
                              <div>
                                <span className="fw-bold">{result.firstName || ""}</span> {result.lastName || ""}
                                {/* Only show phone if available */}
                                <span className="text-muted small-phone">{getPhoneDisplay(result.phone)}</span>
                                <small className="text-muted d-block text-truncate" style={{ maxWidth: "100%" }}>
                                  {result.email || ""}
                                </small>
                              </div>
                            </div>
                          </div>
                        ) : inputType === prefillInfoType.LastName ? (
                          // Format for LastName field with icon
                          <div className="dropdown-content">
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                              <span style={{ marginRight: "5px" }}>{getSourceIcon(result.source)}</span>
                              <div>
                                <span className="fw-bold">{result.lastName || ""}</span>, {result.firstName || ""}
                                {/* Only show phone if available */}
                                <span className="text-muted small-phone">{getPhoneDisplay(result.phone)}</span>
                                <small className="text-muted d-block text-truncate" style={{ maxWidth: "100%" }}>
                                  {result.email || ""}
                                </small>
                              </div>
                            </div>
                          </div>
                        ) : inputType === prefillInfoType.Email ? (
                          // Format for Email field with icon
                          <div className="dropdown-content">
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                              <span style={{ marginRight: "5px" }}>{getSourceIcon(result.source)}</span>
                              <div>
                                <span className="fw-bold text-truncate" style={{ maxWidth: "100%", display: "inline-block" }}>
                                  {result.email || ""}
                                </span>
                                <small className="text-muted d-block">
                                  {result.firstName || ""} {result.lastName || ""}
                                  {/* Only show phone if available */}
                                  {result.phone && (
                                    <span className="text-muted small-phone">{getPhoneDisplay(result.phone)}</span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard formatting for other fields
                          <div className="dropdown-content">
                            <div>{getOptionType(result) || ""}</div>
                            <small className="text-muted text-truncate" style={{ maxWidth: "100%", display: "inline-block" }}>
                              {result.email || ''}
                            </small>
                          </div>
                        )}
                      </MenuItem>
                    ))}
                  </Menu>
                );
              }}
              className={getHighlightClass()}
            />
          </div>
        ) : 
        <Form.Control 
          size="sm" 
          type={getFieldType()} 
          name={inputType.description} 
          value={getValue()} 
          placeholder={getLabel()}
          required 
          validated 
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={getHighlightClass()}
        />
      }
    </>
  );
};

export default CPrefillField;