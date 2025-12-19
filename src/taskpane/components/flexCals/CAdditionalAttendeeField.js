import { useEffect } from "react";
import { Typeahead, Menu, MenuItem } from "react-bootstrap-typeahead";
import { attendeeInputType } from "../../constants/Variables";

const CAdditionalAttendeeField = ({
  inputType,
  contacts,
  selectedAttendee,
  setSelectedAttendee,
  optionClicked,
  setOptionClicked,
}) => {
  const handleInputChange = (text) => {
    const tempSelected = selectedAttendee;
    if (tempSelected.length === 0) {
      tempSelected.push({ email: "", firstName: "", lastName: "" });
    }
    const currentAttendee = tempSelected.pop();
    switch (inputType) {
      case attendeeInputType.Email:
        currentAttendee.email = text;
        break;
      case attendeeInputType.FirstName:
        currentAttendee.firstName = text;
        break;
      default:
        currentAttendee.lastName = text;
        break;
    }
    tempSelected.push(currentAttendee);
    setSelectedAttendee(tempSelected);
  };

  const handleChange = (selected) => {
    if (selected !== 0 && optionClicked) {
      setOptionClicked(false);
      setSelectedAttendee(selected);
    }
  };

  const getLabel = () => {
    switch (inputType) {
      case attendeeInputType.Email:
        return "Email*";
      case attendeeInputType.FirstName:
        return "First Name";
      default:
        return "Last Name";
    }
  };

  const getOptionType = (option) => {
    switch (inputType) {
      case attendeeInputType.Email:
        return option.email;
      case attendeeInputType.FirstName:
        return option.firstName;
      default:
        return option.lastName;
    }
  };

  const getFieldType = () => {
    switch (inputType) {
      case attendeeInputType.Email:
        return "email";
      default:
        return "text";
    }
  };

  useEffect(() => {
    if (selectedAttendee[0].firstName === null) {
      const tempAttendee = [...selectedAttendee];
      tempAttendee[0].firstName = "";
      setSelectedAttendee(tempAttendee);
    }
    if (selectedAttendee[0].lastName === null) {
      const tempAttendee = [...selectedAttendee];
      tempAttendee[0].lastName = "";
      setSelectedAttendee(tempAttendee);
    }
  }, [selectedAttendee]);

  return (
    <Typeahead
      size="sm"
      type={getFieldType()}
      labelKey={(option) => `${getOptionType(option)}`}
      placeholder={getLabel()}
      required
      validated
      options={contacts}
      selected={selectedAttendee}
      onChange={(selected) => handleChange(selected)}
      onInputChange={(text) => handleInputChange(text)}
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
            style={{ maxHeight: "1em" }}
          >
            {filteredResults.map((result, index) => (
              <MenuItem option={result} position={index}>
                {getOptionType(result)}
              </MenuItem>
            ))}
          </Menu>
        );
      }}
    />
  );
};

export default CAdditionalAttendeeField;
