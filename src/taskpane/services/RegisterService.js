import { confirmed_base_url } from "../constants/URLs";

/**
 * Service to handle user registration
 */
const RegisterService = {
    /**
     * Checks if a subscriber already exists
     * @param {string} token - The access token
     * @returns {Promise<object>} - The response from the server
     */
    checkSubscriberExists: async (token) => {
        try {
            const response = await fetch(`${confirmed_base_url}/api/account/subscriberExists`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            return response;
        } catch (error) {
            console.error("Error checking subscriber existence:", error);
            throw error;
        }
    },

    /**
     * Registers a new user
     * @param {string} token - The access token
     * @param {object} registrationData - The registration form data
     * @returns {Promise<object>} - The response from the server
     */
    createAccount: async (token, registrationData) => {
        try {
            const form = { ...registrationData };

            const response = await fetch(`${confirmed_base_url}/api/account/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Registration failed: ${response.status} ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error registering user:", error);
            throw error;
        }
    },

    /**
     * Decodes a JWT token to extract claims
     * @param {string} token 
     * @returns {object}
     */
    decodeToken: (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error decoding token:", e);
            return null;
        }
    }
};

export default RegisterService;
