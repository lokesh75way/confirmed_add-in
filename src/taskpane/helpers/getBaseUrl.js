const getBaseUrl = () => {
    if (process.env.NODE_ENV === "production") {
      return "https://confirmedoutlookaddin.z20.web.core.windows.net";
    } else {
      return "https://localhost:3000";
    }
}

export default getBaseUrl;