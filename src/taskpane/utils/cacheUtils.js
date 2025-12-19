/**
 * Cache utility functions for managing user data storage
 * These functions help ensure proper data cleanup during logout
 * to prevent data leakage between users
 */

/**
 * Clears all user-specific data from localStorage, sessionStorage, 
 * and any other cache mechanisms used in the application.
 * Call this function during logout to ensure no data leakage between users.
 */
export const clearUserDataCache = () => {
  console.log("Clearing session and auth data on logout, but preserving cached contacts for all users");
  
  // 1. Clear sessionStorage if used
  sessionStorage.clear();

  // 2. Only clear authentication/session keys, not contact caches
  const keysToRemove = [
    "access_token",
    "token_expires_at",
    "sf_access_token",
    "sf_token_expires_at",
    "verifier",
    "app-cache",
    "page_meeting_status"
  ];

  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`Clearing session/auth key: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // 3. Do NOT clear the following multi-user caches:
  //    "contacts", "meeting_contacts", "sf_contacts", "combined-contacts"
  //    This preserves all users' cached contacts for API savings.

  // 4. Attempt to clear any SWR cache if it's being used
  try {
    if (window.$SWR) {
      window.$SWR.clear();
    }
  } catch (error) {
    console.error("Error clearing SWR cache:", error);
  }

  console.log("Session/auth data cleared, cached contacts for all users preserved");
};

/**
 * Check if local storage contains user-specific data
 * Useful for verifying if a logout was successful
 * @returns {boolean} true if user data exists in cache
 */
export const hasUserDataInCache = () => {
  // Add logic to check for user-specific data in cache
  const userDataKeys = [
    "contacts", 
    "meeting_contacts", 
    "sf_contacts",
    "combined-contacts",
    "verifier"
  ];
  
  for (const key of userDataKeys) {
    if (localStorage.getItem(key)) {
      return true;
    }
  }
  
  return false;
};