import axios from "axios";
import { confirmed_base_url, confirmed_service_meetings_url } from "../constants/URLs";

/**
 * Fetches detailed information for a specific invitation
 * This is an API call that gets the full invitation details including recipient email
 * We need this secondary API call because the meeting list API doesn't include email addresses
 * 
 * @param {*} invitationId The ID of the invitation
 * @param {*} accessToken Authorization token
 * @returns Detailed invitation data including recipient email
 */
const fetchInvitationDetails = async (invitationId, accessToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(
      `${confirmed_base_url}/api/invitations/${invitationId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for invitation ${invitationId}:`, error);
    return null;
  }
};

/**
 * Creates a unique identifier for a contact based on firstName, lastName, email, AND phone
 * This ensures contacts with different phone numbers are treated as separate entries
 * 
 * @param {string} firstName First name of the contact
 * @param {string} lastName Last name of the contact
 * @param {string} email Email address of the contact
 * @param {string} phone Phone number of the contact
 * @returns {string} A unique identifier string combining all four fields
 */
const createContactUniqueId = (firstName, lastName, email, phone) => {
  // Add fallbacks for all fields
  const normalizedFirst = (firstName || "").toLowerCase().trim();
  const normalizedLast = (lastName || "").toLowerCase().trim();
  const normalizedEmail = (email || "").toLowerCase().trim();
  const normalizedPhone = (phone || "").toLowerCase().trim();
  
  // Return an ID that works even with empty fields
  return `${normalizedFirst}|${normalizedLast}|${normalizedEmail}|${normalizedPhone}`;
};

/**
 * Extracts unique contacts from meeting data with complete details
 * This function performs the following steps:
 * 1. For each meeting in the array, fetches detailed info via API
 * 2. Extracts contact information from meeting details
 * 3. Deduplicates contacts based on firstName+lastName+email+phone
 * 
 * @param {*} meetings Array of basic meeting objects
 * @param {*} accessToken Authorization token
 * @returns Array of unique contacts with emails
 */
const extractContactsWithEmail = async (meetings, accessToken) => {
  if (!meetings || !Array.isArray(meetings)) {
    return [];
  }

  // DEBUG: Log the total number of meetings being processed
  console.log(`DEBUG - Processing ${meetings.length} meetings for contacts`);
  
  // Create a map to store unique contacts based on their unique ID
  const contactsMap = new Map();
  
  // Process each meeting to get detailed information
  // We create an array of promises to fetch all meeting details in parallel
  const detailPromises = meetings.map(async (meeting) => {
    // DEBUG: Log basic meeting recipient info from summary data
    console.log(`DEBUG - Meeting ${meeting.id} basic info:`, {
      firstName: meeting.recipientFirstName,
      lastName: meeting.recipientLastName,
      subject: meeting.subject
    });
    
    // Remove the filtering condition to process all meetings
    try {
      // STEP 1: Make secondary API call to get detailed invitation data
      const details = await fetchInvitationDetails(meeting.id, accessToken);
      
      // STEP 2: Extract contact information (no email check)
      // SAFELY extract fields with fallbacks for missing data
      const firstName = details?.recipientFirstName || meeting?.recipientFirstName || "";
      const lastName = details?.recipientLastName || meeting?.recipientLastName || "";
      const email = details?.recipientEmail || "";
      const phoneNumber = details?.recipientPhoneNumber || "";
      
      // STEP 3: Create a unique ID including the phone number
      // Create ID that works even with missing phone
      const contactId = createContactUniqueId(firstName, lastName, email, phoneNumber);
      
      // STEP 4: Add to map if not already present (deduplication)
      if (!contactsMap.has(contactId)) {
        const contact = {
          id: contactId,
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phoneNumber,
          source: 'meeting'
        };
        
        contactsMap.set(contactId, contact);
        
        // DEBUG: Log when a new unique contact is added
        console.log(`DEBUG - Added unique contact:`, {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          uniqueId: contactId
        });
      } else {
        // DEBUG: Log when a duplicate is found
        console.log(`DEBUG - Duplicate contact found:`, {
          firstName,
          lastName,
          email,
          phone: phoneNumber,
          uniqueId: contactId
        });
      }
    } catch (error) {
      console.error(`Error processing meeting ${meeting.id}:`, error);
    }
  });
  
  // STEP 5: Wait for all promises to resolve
  // This ensures we've processed all meetings before returning results
  await Promise.all(detailPromises);
  
  // STEP 6: Convert the Map values back to an array
  const result = Array.from(contactsMap.values());
  
  // DEBUG: Log summary of extracted contacts
  console.log(`DEBUG - Extracted ${result.length} unique contacts from meetings`);
  
  return result;
};

/**
 * Fetches meetings from a specific page
 * This function calls the API to get a single page of meetings
 * 
 * @param {string} accessToken Authorization token
 * @param {number} pageNumber Page number to fetch (0-based)
 * @param {number} pageSize Number of meetings per page
 * @returns Object containing meetings array and total records count
 */
const fetchMeetingsPage = async (accessToken, pageNumber, pageSize) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // DEBUG: Log current page being fetched
    console.log(`DEBUG - Fetching meetings page ${pageNumber} with pageSize: ${pageSize}`);

    // Make API call to get a single page of meetings
    const response = await axios.post(
      `${confirmed_service_meetings_url}`,
      {
        Subject: "", // No subject filter
        RecipientFirstName: "", // No first name filter
        RecipientLastName: "", // No last name filter
        PageNumber: pageNumber, // Which page to fetch
        ResultsPerPage: pageSize, // How many meetings per page
      },
      { headers }
    );

    // DEBUG: Log the meetings count from this page
    console.log(`DEBUG - Page ${pageNumber}: Received ${response.data?.meetings?.length || 0} meetings`);

    // Return both the meetings and the total record count
    return {
      meetings: response.data?.meetings || [],
      totalRecords: response.data?.totalRecords || 0
    };
  } catch (error) {
    console.error(`Error fetching meetings page ${pageNumber}:`, error);
    return { meetings: [], totalRecords: 0 };
  }
};

/**
 * Fetches meetings and extracts contact information from them across multiple pages
 * This is the main entry point that:
 * 1. Fetches multiple pages of meetings in parallel for efficiency
 * 2. Combines all meetings from all pages
 * 3. Extracts unique contacts from all meetings
 * 
 * @param {*} accessToken Authorization token
 * @param {*} pageSize Number of meetings per page
 * @param {*} maxPages Maximum number of pages to fetch
 * @returns Array of contacts extracted from meetings with emails
 */
const fetchMeetingContacts = async (accessToken, pageSize = 10, maxPages = 100) => {
  try {
    // DEBUG: Log start of multi-page fetching
    console.log(`DEBUG - Starting to fetch up to ${maxPages} pages of meetings, ${pageSize} per page`);
    
    const allMeetings = [];
    let totalPages = maxPages;
    let currentPage = 0;
    
    // STEP 1: Fetch first page to get total records and calculate total pages
    // This helps us determine how many total pages exist
    const firstPageResult = await fetchMeetingsPage(accessToken, 0, pageSize);
    allMeetings.push(...firstPageResult.meetings);
    
    // STEP 2: Calculate actual total pages based on total records
    // If there are fewer total pages than our max, we only fetch what's available
    const calculatedTotalPages = Math.ceil(firstPageResult.totalRecords / pageSize);
    totalPages = Math.min(calculatedTotalPages, maxPages);
    
    console.log(`DEBUG - Total records: ${firstPageResult.totalRecords}, will fetch ${totalPages} pages`);
    
    // STEP 3: Fetch remaining pages in parallel for better performance
    const pagePromises = [];
    for (let page = 1; page < totalPages; page++) {
      pagePromises.push(fetchMeetingsPage(accessToken, page, pageSize));
    }
    
    // STEP 4: Wait for all page requests to complete
    const pageResults = await Promise.all(pagePromises);
    
    // STEP 5: Add meetings from all pages to our collection
    pageResults.forEach(result => {
      allMeetings.push(...result.meetings);
    });
    
    console.log(`DEBUG - Fetched a total of ${allMeetings.length} meetings across ${totalPages} pages`);
    
    // STEP 6: Process all meetings to extract contacts
    if (allMeetings.length > 0) {
      // Extract contacts from all meetings across all pages
      const contacts = await extractContactsWithEmail(allMeetings, accessToken);
      
      // DEBUG: Log the final contacts list
      console.log(`DEBUG - Final meeting contacts (${contacts.length}) from ${allMeetings.length} meetings:`, 
        contacts.map(c => ({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email
        }))
      );
      
      return contacts;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching meeting contacts:", error);
    return [];
  }
};

export { fetchMeetingContacts };
