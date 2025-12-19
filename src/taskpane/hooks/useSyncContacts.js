import { useState } from "react";
import { syncRecentMeetingContacts } from "../services/SyncContactsService";
import { parseJwt } from '../utils/jwtUtils';
import { createContactUniqueId } from '../utils/contactUtils';

/**
 * Hook to handle synchronizing recent meeting contacts when the sync button is clicked
 * This preserves existing contacts while adding new ones from the most recent meetings
 * 
 * @param {Object} params - Parameters for the hook
 * @param {string} params.accessToken - The access token for API calls
 * @returns {Object} - Contains the sync function and state variables
 */
export function useSyncContacts({ accessToken }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [syncStats, setSyncStats] = useState(null);

  // The actual function to call when the sync button is clicked
  const syncContacts = async () => {
    if (isSyncing) {
      console.log('[useSyncContacts] Sync already in progress, skipping request');
      return {
        success: false,
        message: "Sync already in progress"
      };
    }
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      setSyncStats(null);
      
      console.log("[useSyncContacts] Starting contact sync operation...");
      
      // Get user ID from the access token
      const userId = accessToken ? parseJwt(accessToken).sub : null;
      if (!userId) {
        const noUserError = "No user ID available from access token";
        console.error(`[useSyncContacts] ${noUserError}`);
        setSyncError(noUserError);
        return {
          success: false,
          message: noUserError
        };
      }
      
      // Step 1: Get current cached meeting contacts
      const MEETING_CONTACTS_CACHE_KEY = 'confirmed-meeting-contacts';
      const cachedContactsData = JSON.parse(localStorage.getItem(MEETING_CONTACTS_CACHE_KEY) || "{}");
      const userCache = cachedContactsData[userId] || { data: [], timestamp: 0 };
      const existingContacts = userCache.data || [];
      
      console.log(`[useSyncContacts] Found ${existingContacts.length} existing contacts in cache for user ${userId}`);
      
      // Step 2: Fetch the latest meeting contacts
      const { contacts: recentContacts, metadata } = await syncRecentMeetingContacts(accessToken, 20);
      
      console.log(`[useSyncContacts] Fetched ${recentContacts.length} recent contacts from meetings`);
      
      if (!recentContacts.length && metadata.error) {
        console.error(`[useSyncContacts] Failed to fetch contacts: ${metadata.error}`);
        setSyncError(metadata.error);
        setSyncStats({
          totalContacts: existingContacts.length,
          newContacts: 0,
          errorDetails: metadata.error
        });
        return {
          success: false,
          message: `Failed to sync: ${metadata.error}`
        };
      }
      
      // Step 3: Merge existing and new contacts, preserving existing ones
      const { mergedContacts, newContactsAdded, updatedContacts } = mergeContacts(existingContacts, recentContacts);
      
      console.log(`[useSyncContacts] Merge results:
  - Total contacts after merge: ${mergedContacts.length}
  - New contacts added: ${newContactsAdded.length}
  - Updated existing contacts: ${updatedContacts.length}`);
      
      if (newContactsAdded.length > 0) {
        console.log('[useSyncContacts] New contacts added:', newContactsAdded.map(c => `${c.firstName} ${c.lastName} (${c.email || 'No email'})`));
      }
      
      // Step 4: Update the cache with the merged contacts
      cachedContactsData[userId] = {
        timestamp: Date.now(),
        data: mergedContacts
      };
      
      localStorage.setItem(MEETING_CONTACTS_CACHE_KEY, JSON.stringify(cachedContactsData));
      console.log(`[useSyncContacts] Updated localStorage cache for user ${userId}`);
      
      // Step 5: Update state with the result
      const now = new Date();
      setLastSyncTime(now);
      
      const stats = {
        totalContacts: mergedContacts.length,
        newContacts: newContactsAdded.length,
        updatedContacts: updatedContacts.length,
        meetingsProcessed: metadata.successfulMeetings || 0,
        totalMeetings: metadata.totalMeetings || 0,
        syncedAt: now.toISOString(),
        errors: metadata.errors || []
      };
      
      setSyncStats(stats);
      setSyncResult({
        success: true,
        message: newContactsAdded.length > 0 
          ? `Added ${newContactsAdded.length} new contacts from your recent meetings` 
          : "No new contacts found in your recent meetings"
      });
      
      console.log("[useSyncContacts] Contact sync completed successfully", stats);
      
      return {
        success: true,
        message: newContactsAdded.length > 0 
          ? `Added ${newContactsAdded.length} new contacts from your recent meetings` 
          : "Checked your meetings, but no new contacts found"
      };
    } catch (error) {
      console.error("[useSyncContacts] Error during contact sync:", error);
      setSyncError(error.message || "Failed to sync contacts");
      setSyncStats({
        error: error.message,
        syncedAt: new Date().toISOString()
      });
      return {
        success: false,
        message: `Sync failed: ${error.message || "Unknown error"}`
      };
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    syncContacts,
    isSyncing,
    lastSyncTime,
    syncError,
    syncResult,
    syncStats
  };
}

/**
 * Merges existing contacts with newly fetched contacts
 * Uses the same deduplication logic as the main application
 * 
 * @param {Array} existingContacts - Existing contacts from cache
 * @param {Array} newContacts - Newly fetched contacts
 * @returns {Object} - Contains merged contacts and stats on additions/updates
 */
function mergeContacts(existingContacts, newContacts) {
  // Use a Map to ensure uniqueness based on the contact ID
  const contactsMap = new Map();
  const newContactsAdded = [];
  const updatedContacts = [];
  
  // First add all existing contacts to the map
  existingContacts.forEach(contact => {
    // Create a unique ID using the same logic as the main app
    const id = contact.id || createContactUniqueId(contact);
    contactsMap.set(id, contact);
  });
  
  // Then process new contacts, tracking which ones are truly new
  newContacts.forEach(contact => {
    const id = contact.id || createContactUniqueId(contact);
    
    if (!contactsMap.has(id)) {
      // This is a new contact
      contactsMap.set(id, contact);
      newContactsAdded.push(contact);
    } else {
      // This is an existing contact - check if we need to update it
      const existingContact = contactsMap.get(id);
      
      // Logic to determine if the new contact has more/better information
      const shouldUpdate = 
        (!existingContact.email && contact.email) ||
        (!existingContact.phone && contact.phone) ||
        (contact.createDate && (!existingContact.createDate || 
         new Date(contact.createDate) > new Date(existingContact.createDate)));
      
      if (shouldUpdate) {
        // The new contact has more/better information, so update the existing one
        const updatedContact = { ...existingContact, ...contact };
        contactsMap.set(id, updatedContact);
        updatedContacts.push(updatedContact);
      }
    }
  });
  
  // Convert the Map back to an array
  const mergedContacts = Array.from(contactsMap.values());
  
  return { 
    mergedContacts,
    newContactsAdded,
    updatedContacts
  };
}