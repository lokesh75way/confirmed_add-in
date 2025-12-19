import axios from "axios";
import { confirmed_base_url } from "../constants/URLs";

/**
 * Lists contacts for the current user from external providers
 * When a contact has multiple emails, creates separate contacts for each email
 * @param {string} accessToken API authorization token
 * @param {string} userName User name for the current user
 * @returns Array of contact objects with firstName, lastName, email, and phone
 */
export const listContactsForUser = async (accessToken, userName) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      `${confirmed_base_url}/api/users/getExternalContacts`,
      {
        userName: userName,
        externalProviders: [""] // This could be expanded to include specific providers
      },
      { headers }
    );

    // Create an array to hold all expanded contacts
    const expandedContacts = [];

    // Process each contact from the API
    response.data.forEach(contact => {
      // If a contact has multiple emails (in an array), create separate contacts for each email
      if (Array.isArray(contact.email)) {
        // Contact has multiple emails
        contact.email.forEach(email => {
          expandedContacts.push({
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            email: email || "",
            phone: contact.phoneNumber || "",
            source: 'external'
          });
        });
      } else {
        // Contact has a single email (or none)
        expandedContacts.push({
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          email: contact.email || "",
          phone: contact.phoneNumber || "",
          source: 'external'
        });
      }
    });

    console.log(`Processed ${response.data.length} contacts into ${expandedContacts.length} expanded contacts`);
    return expandedContacts;
  } catch (error) {
    console.error("Error fetching external contacts:", error);
    return [];
  }
};
