import axios from "axios";
import { confirmed_base_url } from "../constants/URLs";
/**
 * Fetches contacts and leads from Salesforce
 * 
 * @returns {Array} Array of contacts from Salesforce
 */
const fetchSalesforceContacts = async () => {
  try {

    const contacts = await fetchSalesforceContactRecords();

    const leads = await fetchSalesforceLeadRecords();
    const combinedRecords = [...contacts, ...leads];
    return combinedRecords;
  } catch (error) {
    console.error("Error fetching Salesforce contacts:", error);
    return [];
  }
};


/**
 * Fetches Contact records from Salesforce
 * 
 * @returns {Array} Contact records
 */
const fetchSalesforceContactRecords = async () => {
  try {
    const tokenData = JSON.parse(localStorage.getItem("access_token"));
    const token = tokenData?.access_token;

    if (!token) {
      console.error("No Confirmed access token found in localStorage");
      return [];
    }

    let allRecords = [];
    const apiUrl = `${confirmed_base_url}/api/salesforce/listContacts`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.records && Array.isArray(data.records)) {
      const transformedRecords = data.records.map(record => ({
        id: record.Id,
        firstName: record.FirstName || '',
        lastName: record.LastName || '',
        email: record.Email,
        phone: record.Phone || '',
        source: 'salesforce-contact'
      }));

      allRecords = [...allRecords, ...transformedRecords];
    }
    return allRecords;
  } catch (error) {
    console.error("Error fetching Salesforce contacts:", error);
    return [];
  }
};

/**
 * Fetches Lead records from Salesforce
 * 
 * @returns {Array} Lead records
 */
const fetchSalesforceLeadRecords = async () => {
  try {
    const tokenData = JSON.parse(localStorage.getItem("access_token"));
    const token = tokenData?.access_token;

    if (!token) {
      console.error("No Confirmed access token found in localStorage");
      return [];
    }

    let allRecords = [];

    const apiUrl = `${confirmed_base_url}/api/salesforce/listLeads`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.records && Array.isArray(data.records)) {
      const transformedRecords = data.records.map(record => ({
        id: record.Id,
        firstName: record.FirstName || '',
        lastName: record.LastName || '',
        email: record.Email,
        phone: record.Phone || '',
        source: 'salesforce-lead'
      }));

      allRecords = [...allRecords, ...transformedRecords];
    }


    return allRecords;
  } catch (error) {
    console.error("Error fetching Salesforce leads:", error);
    return [];
  }
};

export { fetchSalesforceContacts };
