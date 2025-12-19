import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
// import reportWebVitals from "./reportWebVitals";
import "@fontsource/mulish"; // Defaults to weight 400.
import { SWRConfig } from "swr";

let isOfficeInitialized = false;

const title = "Confirmed Outlook Add-in";

const local_storage_key = "app-cache";

const localStorageProvider = () => {
  // When initializing, we restore the data from `localStorage` into a map.
  const map = new Map(JSON.parse(localStorage.getItem(local_storage_key) || "[]"));

  // Before unloading the app, we write back all the data into `localStorage`.
  window.addEventListener("beforeunload", () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem(local_storage_key, appCache);
  });

  // We still use the map for write & read for performance.
  return map;
};

const renderApp = (Component) => {
  const container = document.getElementById("container");
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <SWRConfig value={{ refreshInterval: 1800000, revalidateOnFocus: false }}>
        <Component title={title} isOfficeInitialized={isOfficeInitialized} />
      </SWRConfig>
    </React.StrictMode>
  );
};

// Check if Office.js is already loaded
if (window.Office) {
  // Office is already available
  isOfficeInitialized = true;
  Office.onReady(() => {
    renderApp(App);
  });
} else {
  // Office.js isn't loaded yet - wait for it to be available
  document.addEventListener('office:loaded', () => {
    console.log("Received office:loaded event");
    if (window.Office) {
      Office.onReady(() => {
        isOfficeInitialized = true;
        renderApp(App);
      });
    }
  });
  
  // Fallback in case the event doesn't fire
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!isOfficeInitialized) {
        if (window.Office) {
          Office.onReady(() => {
            isOfficeInitialized = true;
            renderApp(App);
          });
        } else {
          // Last resort fallback
          console.warn('Office.js not loaded after timeout. Running in limited mode.');
          isOfficeInitialized = false;
          renderApp(App);
        }
      }
    }, 2000); 
  });
}
