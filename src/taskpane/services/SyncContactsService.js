import axios from "axios";
import { confirmed_base_url } from "../constants/URLs";

/**
 * Fetches the most recent meeting contacts without clearing the cache
 * This is specifically designed to be called when the sync button is pressed
 * 
 * @param {string} accessToken API access token
 * @param {number} limit Number of most recent meetings to fetch (default: 20)
 * @returns {Promise<Object>} Object containing fresh contacts and metadata
 */
export const syncRecentMeetingContacts = async (accessToken, limit = 20) => {
  try {
    console.log(`[SyncContactsService] Starting sync process for up to ${limit} most recent meetings...`);
    
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Use current date for end date and lookback 30 days for start date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Look back 30 days

    console.log(`[SyncContactsService] Fetching meetings from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Call the meetings API with sorting by creation date (newest first)
    const response = await axios.post(
      `${confirmed_base_url}/api/invitations/meetings`,
      {
        Subject: "",
        RecipientFirstName: "",
        RecipientLastName: "",
        PageNumber: 0,
        ResultsPerPage: limit,
        StartDate: startDate.toISOString(),
        EndDate: endDate.toISOString(),
        SortBy: "CreateDate",
        SortDirection: "DESC"  // Newest first
      },
      { headers }
    );

    // Process the response to extract contacts
    const meetings = response.data.meetings || [];
    console.log(`[SyncContactsService] API returned ${meetings.length} recent meetings out of ${response.data.totalRecords} total`);

    // If no meetings found, return empty result with appropriate message
    if (meetings.length === 0) {
      console.log('[SyncContactsService] No meetings found in the specified date range');
      return { 
        contacts: [], 
        metadata: { 
          totalMeetings: 0,
          success: true,
          message: "No meetings found in the specified date range" 
        } 
      };
    }

    // Extract contacts from the meetings by making individual API calls for each meeting
    const contactsMap = new Map();
    const errors = [];
    let successfulMeetings = 0;
    let skippedContacts = 0;
    
    // Create an array of promises to fetch meeting details in parallel
    const detailPromises = meetings.map(async (meeting) => {
      try {
        console.log(`[SyncContactsService] Processing meeting ${meeting.id} - "${meeting.subject || 'No subject'}"`);
        
        // Get detailed invitation info to access recipient email
        const details = await fetchInvitationDetails(meeting.id, accessToken);
        
        if (!details) {
          console.warn(`[SyncContactsService] Could not fetch details for meeting ${meeting.id}`);
          errors.push(`Failed to fetch details for meeting ${meeting.id}`);
          return;
        }
        
        // Extract contact information
        const firstName = details?.recipientFirstName || meeting?.recipientFirstName || "";
        const lastName = details?.recipientLastName || meeting?.recipientLastName || "";
        const email = details?.recipientEmail || "";
        const phoneNumber = details?.recipientPhoneNumber || "";
        
        // Skip contacts with missing first or last name
        if (!firstName || !lastName) {
          console.warn(`[SyncContactsService] Skipping contact with incomplete name: [${firstName} ${lastName}]`);
          skippedContacts++;
          return;
        }
        
        // Create a unique contact ID for deduplication
        const contactId = createContactId(firstName, lastName, email, phoneNumber);
        
        if (!contactsMap.has(contactId)) {
          const contact = {
            id: contactId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phoneNumber,
            source: 'meeting',
            meetingId: meeting.id,
            createDate: meeting.createDate
          };
          
          contactsMap.set(contactId, contact);
          console.log(`[SyncContactsService] Added new contact: ${firstName} ${lastName} (${email || 'No email'}) from meeting ${meeting.id}`);
        } else {
          console.log(`[SyncContactsService] Duplicate contact found: ${firstName} ${lastName} (${email || 'No email'})`);
        }
        
        successfulMeetings++;
      } catch (error) {
        console.error(`[SyncContactsService] Error processing meeting ${meeting.id}:`, error);
        errors.push(`Error processing meeting ${meeting.id}: ${error.message || 'Unknown error'}`);
      }
    });
    
    // Wait for all promises to resolve
    await Promise.all(detailPromises);
    
    // Convert the Map to an array
    const contactsArray = Array.from(contactsMap.values());
    
    console.log(`[SyncContactsService] Sync completed with results:
  - Meetings processed: ${successfulMeetings}/${meetings.length}
  - New unique contacts extracted: ${contactsArray.length}
  - Contacts skipped (incomplete data): ${skippedContacts}
  - Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('[SyncContactsService] Errors encountered during sync:', errors);
    }
    
    return {
      contacts: contactsArray,
      metadata: {
        totalMeetings: meetings.length,
        successfulMeetings: successfulMeetings,
        skippedContacts: skippedContacts,
        errors: errors,
        syncedAt: new Date().toISOString(),
        success: errors.length === 0 || contactsArray.length > 0
      }
    };
  } catch (error) {
    console.error('[SyncContactsService] Fatal error during sync process:', error);
    return { 
      contacts: [], 
      metadata: { 
        error: error.message || 'Unknown error during sync',
        syncedAt: new Date().toISOString(),
        success: false
      } 
    };
  }
};

/**
 * Fetches detailed information for a specific invitation
 * This is an API call that gets the full invitation details including recipient email
 * 
 * @param {string} invitationId The ID of the invitation
 * @param {string} accessToken Authorization token
 * @returns {Object} Detailed invitation data including recipient email
 */
const fetchInvitationDetails = async (invitationId, accessToken) => {
  try {
    console.log(`[SyncContactsService] Fetching details for invitation ${invitationId}`);
    
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Make API call to get detailed invitation info including recipient email
    const response = await axios.get(
      `${confirmed_base_url}/api/invitations/${invitationId}`,
      { headers }
    );
    
    console.log(`[SyncContactsService] Successfully fetched details for invitation ${invitationId}`);
    return response.data;
  } catch (error) {
    console.error(`[SyncContactsService] Error fetching details for invitation ${invitationId}:`, error);
    console.error(`[SyncContactsService] Status: ${error.response?.status}, Message: ${error.response?.statusText || error.message}`);
    return null;
  }
};

/**
 * Creates a unique identifier for a contact based on firstName, lastName, email, AND phone
 * Used for deduplication when merging with existing contacts
 * 
 * @param {string} firstName First name of the contact
 * @param {string} lastName Last name of the contact
 * @param {string} email Email address of the contact
 * @param {string} phone Phone number of the contact
 * @returns {string} A unique identifier string combining all fields
 */
const createContactId = (firstName, lastName, email, phone) => {
  // Add fallbacks for all fields
  const normalizedFirst = (firstName || "").toLowerCase().trim();
  const normalizedLast = (lastName || "").toLowerCase().trim();
  const normalizedEmail = (email || "").toLowerCase().trim();
  const normalizedPhone = (phone || "").toLowerCase().trim();
  
  // Return an ID that works even with empty fields
  return `${normalizedFirst}|${normalizedLast}|${normalizedEmail}|${normalizedPhone}`;
};