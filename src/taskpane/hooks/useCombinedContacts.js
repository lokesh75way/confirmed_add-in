import { useState, useEffect, useMemo } from "react";
import { useContactsData } from "./ContactsHook";
import { fetchMeetingContacts } from "../services/MeetingContactsService";
import { fetchSalesforceContacts } from "../services/SalesforceContactsService";

/**
 * Creates a unique identifier for a contact based on firstName, lastName, email, and phone
 * This ensures contacts with different phone numbers are treated as separate entries
 * 
 * @param {object} contact The contact object
 * @returns {string} A unique identifier string combining name, email and phone fields
 */
const createContactUniqueId = (contact) => {
  // Normalize values to lowercase and remove extra spaces
  const normalizedFirst = (contact.firstName || "").toLowerCase().trim();
  const normalizedLast = (contact.lastName || "").toLowerCase().trim();
  const normalizedEmail = (contact.email || "").toLowerCase().trim();
  const normalizedPhone = (contact.phone || contact.phoneNumber || "").toLowerCase().trim();
  
  // Include phone in the unique ID if it exists
  if (normalizedPhone) {
    // If phone exists, include it to differentiate contacts with same name/email but different phones
    return `${normalizedFirst}|${normalizedLast}|${normalizedEmail}|${normalizedPhone}`;
  } else if (normalizedEmail) {
    // If no phone but email exists, use the name+email combination (backward compatible)
    return `${normalizedFirst}|${normalizedLast}|${normalizedEmail}`;
  } else {
    // Fallback for contacts with only names (backward compatible)
    return `${normalizedFirst}|${normalizedLast}|`;
  }
};

// Cache keys for localStorage
// These keys are used to store and retrieve cached contacts and their timestamp
const MEETING_CONTACTS_CACHE_KEY = 'confirmed-meeting-contacts';
const SF_CONTACTS_CACHE_KEY = 'salesforce-contacts';
// Cache expiration time in milliseconds (7 days)
// After this period, we consider the cache stale and fetch fresh data
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Hook that combines contacts from regular contacts source and meetings with caching
 * This hook is the main entry point for contact aggregation with three key features:
 * 1. Fast initial load using cached contacts
 * 2. Background refresh for older cache data
 * 3. Deduplication based on firstName+lastName+email combination
 * 
 * @param {object} params Parameters object
 * @param {string} params.accessToken The access token for API calls
 * @param {string} params.userName The username for the current user
 * @param {object} params.sfAccessToken The Salesforce access token
 * @returns {object} Object containing combined contacts and loading state
 */
export const useCombinedContacts = ({ accessToken, userName, isSalesforceConnected }) => {
  // State for storing contacts from meetings
  const [meetingContacts, setMeetingContacts] = useState([]);
  // State for storing contacts from Salesforce
  const [salesforceContacts, setSalesforceContacts] = useState([]);
  // Loading state - true when we're fetching initial contacts
  const [loading, setLoading] = useState(true);
  // Error state for tracking API failures
  const [error, setError] = useState(null);
  // Flag to indicate background refresh is happening
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get existing contacts from the primary source using another hook
  const existingContacts = useContactsData({
    initialData: undefined,
    accessToken,
    userName,
  });

  // Decode the access token to get the current user ID
  const currentUserId = accessToken ? parseJwt(accessToken).sub : null;

  /**
   * Function to fetch fresh meeting contacts and update cache
   * This is called either on initial load or during background refresh
   * @param {string} token The access token for API authorization
   * @returns {Array} The fetched contacts array
   */
  const refreshMeetingContacts = async (token) => {
    try {
      // Set refreshing flag to track background updates
      setIsRefreshing(true);
      console.log('Fetching fresh meeting contacts...');
      
      // Call the service to fetch contacts from multiple meeting pages
      // Parameters:
      // - token: access token for auth
      // - 10: page size (10 meetings per page)
      // - 10: max pages (up to 10 pages, or 100 meetings)
      const contacts = await fetchMeetingContacts(token, 10, 10);
      
      // Update state with the fresh contacts
      setMeetingContacts(contacts);
      
      // Store the contacts in cache for future use
      saveMeetingContactsToCache(contacts, currentUserId);
      
      return contacts;
    } catch (err) {
      console.error("Failed to fetch meeting contacts", err);
      setError(err);
      return [];
    } finally {
      // Always clear the refreshing flag when done
      setIsRefreshing(false);
    }
  };

  /**
   * Function to fetch fresh Salesforce contacts and update cache
   * @returns {Array} The fetched contacts array
   */
  const refreshSalesforceContacts = async () => {
    try {
      setIsRefreshing(true);
      console.log('Starting Salesforce contacts refresh');
      
      // Call the service to fetch contacts from Salesforce
      const contacts = await fetchSalesforceContacts();
      console.log(`Salesforce API returned ${contacts.length} contacts/leads`);
      
      // Update state with the fresh contacts
      setSalesforceContacts(contacts);
      console.log(`Updated salesforceContacts state with ${contacts.length} contacts`);
      
      // Store the contacts in cache for future use
      if (contacts.length > 0) {
        saveSalesforceContactsToCache(contacts, currentUserId);
      }
      
      return contacts;
    } catch (err) {
      console.error("Failed to fetch Salesforce contacts:", err);
      setError(err);
      return [];
    } finally {
      setIsRefreshing(false);
    }
  };

  // Effect to load meeting contacts, runs when the accessToken changes
  useEffect(() => {
    if (!accessToken) { setLoading(false); return; }

    const getMeetingContacts = async () => {
      setLoading(true);
      const cachedContacts = getCachedMeetingContacts(currentUserId);
      if (cachedContacts) {
        console.log(`useCombinedContacts: Loaded ${cachedContacts.length} meeting contacts from cache for user ${currentUserId}`);
        setMeetingContacts(cachedContacts);
        setLoading(false);
        // check background refresh
        const all = JSON.parse(localStorage.getItem(MEETING_CONTACTS_CACHE_KEY) || "{}");
        const entry = all[currentUserId];
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_EXPIRATION) {
          console.log('useCombinedContacts: Cache expired, refreshing meeting contacts in background');
          setTimeout(() => refreshMeetingContacts(accessToken), 1000);
        }
      } else {
        console.log(`useCombinedContacts: No cached meeting contacts for user ${currentUserId}, fetching from API`);
        try {
          await refreshMeetingContacts(accessToken);
        } finally {
          setLoading(false);
        }
      }
    };
    getMeetingContacts();
  }, [accessToken]);

  // Effect to load Salesforce contacts, runs when isSalesforceConnected status changes
  useEffect(() => {
    if (!isSalesforceConnected) {
      setSalesforceContacts([]);
      return;
    }

    const getSalesforceContacts = async () => {
      const cachedContacts = getCachedSalesforceContacts(currentUserId);
      if (cachedContacts) {
        console.log(`useCombinedContacts: Loaded ${cachedContacts.length} Salesforce contacts from cache for user ${currentUserId}`);
        setSalesforceContacts(cachedContacts);
        // background refresh
        const all = JSON.parse(localStorage.getItem(SF_CONTACTS_CACHE_KEY) || "{}");
        const entry = all[currentUserId];
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_EXPIRATION) {
          console.log('useCombinedContacts: Salesforce cache expired, refreshing in background');
          setTimeout(() => refreshSalesforceContacts(sfAccessToken), 1000);
        }
      } else {
        console.log(`useCombinedContacts: No cached Salesforce contacts for user ${currentUserId}, fetching from API`);
        try {
          await refreshSalesforceContacts();
        } catch (err) {
          console.error(err);
        }
      }
    };

    if (accessToken) {
      getSalesforceContacts();
    }
  }, [isSalesforceConnected, accessToken]);

  /**
   * Combine and deduplicate contacts from all sources
   * This useMemo optimizes performance by only recalculating when
   * either existingContacts or meetingContacts change
   */
  const combinedContacts = useMemo(() => {
    // Use a Map to ensure uniqueness based on firstName, lastName, AND email
    const contactsMap = new Map();
    
    // For logging/debugging
    let existingCount = 0;
    let meetingCount = 0;
    let salesforceCount = 0;
    let duplicateCount = 0;
    let discardedCount = 0;

    // STEP 1: Process existing contacts first (they take priority)
    if (existingContacts && Array.isArray(existingContacts)) {
      existingContacts.forEach(contact => {
        // Only include contacts that have BOTH firstName AND lastName
        if (contact.firstName && contact.lastName) {
          // Ensure all fields exist with defaults to prevent errors
          const processedContact = {
            ...contact,
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            email: contact.email || "",
            phone: contact.phone || contact.phoneNumber || ``
          };
          
          const uniqueId = createContactUniqueId(processedContact);
          contactsMap.set(uniqueId, processedContact);
          existingCount++;
        } else {
          discardedCount++;
        }
      });
    }

    // STEP 2: Add meeting contacts if they don't already exist
    meetingContacts.forEach(contact => {
      // Only include contacts that have BOTH firstName AND lastName
      if (contact.firstName && contact.lastName) {
        const processedContact = {
          ...contact,
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          email: contact.email || "",
          phone: contact.phone || ``
        };
        
        const uniqueId = createContactUniqueId(processedContact);
        if (!contactsMap.has(uniqueId)) {
          contactsMap.set(uniqueId, processedContact);
          meetingCount++;
        } else {
          duplicateCount++;
        }
      } else {
        discardedCount++;
      }
    });

    // STEP 3: Add Salesforce contacts if they don't already exist
    salesforceContacts.forEach(contact => {
      // Only include contacts that have BOTH firstName AND lastName
      if (contact.firstName && contact.lastName) {
        const processedContact = {
          ...contact,
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          email: contact.email || "",
          phone: contact.phone || contact.phoneNumber || ``
        };
        
        const uniqueId = createContactUniqueId(processedContact);
        if (!contactsMap.has(uniqueId)) {
          contactsMap.set(uniqueId, processedContact);
          salesforceCount++;
        } else {
          duplicateCount++;
        }
      } else {
        discardedCount++;
      }
    });

    // Log contact source breakdown for troubleshooting
    console.log('Combined contacts breakdown:', {
      totalContacts: contactsMap.size,
      fromExistingSources: existingCount,
      fromMeetings: meetingCount,
      fromSalesforce: salesforceCount,
      duplicatesSkipped: duplicateCount,
      contactsDiscarded: discardedCount,
      salesforceAvailable: salesforceContacts.length
    });

    // STEP 4: Convert the Map values back to an array
    return Array.from(contactsMap.values());
  }, [existingContacts, meetingContacts, salesforceContacts]);

  // Return the combined data and status flags
  return {
    contacts: combinedContacts,
    // Only show loading if we have no contacts to display yet
    loading: loading && !combinedContacts.length,
    error,
    isRefreshing
  };
};

/**
 * Helper to get contacts from localStorage cache if available and not expired
 * This function checks if we have valid cached contacts and returns them
 * If the cache is expired or invalid, it returns null
 * @returns {Array|null} The cached contacts or null if cache is invalid/expired
 */
const getCachedMeetingContacts = (userId) => {
  const all = JSON.parse(localStorage.getItem(MEETING_CONTACTS_CACHE_KEY) || "{}");
  const entry = all[userId];
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_EXPIRATION) return null;
  return entry.data;
};

/**
 * Helper to save contacts to localStorage cache
 * This function serializes contacts to JSON and stores them in localStorage
 * It also stores a timestamp to track when the cache was last updated
 * @param {Array} contacts The contact objects to cache
 */
const saveMeetingContactsToCache = (contacts, userId) => {
  try {
    const all = JSON.parse(localStorage.getItem(MEETING_CONTACTS_CACHE_KEY) || "{}");
    all[userId] = { timestamp: Date.now(), data: contacts };
    localStorage.setItem(MEETING_CONTACTS_CACHE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving meeting contacts cache:', e);
  }
};

/**
 * Helper to get Salesforce contacts from localStorage cache if available and not expired
 * @returns {Array|null} The cached contacts or null if cache is invalid/expired
 */
const getCachedSalesforceContacts = (userId) => {
  const all = JSON.parse(localStorage.getItem(SF_CONTACTS_CACHE_KEY) || "{}");
  const entry = all[userId];
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_EXPIRATION) return null;
  return entry.data;
};

/**
 * Helper to save Salesforce contacts to localStorage cache
 * @param {Array} contacts The Salesforce contact objects to cache
 */
const saveSalesforceContactsToCache = (contacts, userId) => {
  try {
    const all = JSON.parse(localStorage.getItem(SF_CONTACTS_CACHE_KEY) || "{}");
    all[userId] = { timestamp: Date.now(), data: contacts };
    localStorage.setItem(SF_CONTACTS_CACHE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving Salesforce contacts cache:', e);
  }
}

// Helper to parse JWT without external dependency
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}
