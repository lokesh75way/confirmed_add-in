/**
 * Creates a unique identifier for a contact based on firstName, lastName, email, and phone
 * This ensures contacts with different phone numbers are treated as separate entries
 * 
 * @param {object} contact The contact object
 * @returns {string} A unique identifier string combining name, email and phone fields
 */
export const createContactUniqueId = (contact) => {
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