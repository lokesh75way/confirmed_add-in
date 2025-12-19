import "./App.css";
import React, { useEffect, useState } from "react";
import VLogin from "./views/VLogin";
import VSignup from "./views/VSignup";
import CMenuTab from "./components/common/CMenuTab";
import useLocalStorage from "./hooks/useLocalStorage";
import CLogout from "./components/common/CLogout";
import { useSyncContacts } from "./hooks/useSyncContacts";
import getUserInfo from "./services/GetUserInfo";
import { FiRefreshCw } from "react-icons/fi";
import { Tooltip, OverlayTrigger, Toast } from "react-bootstrap";

function App() {
  // Confirmed API accessToken (from auth0)
  const [accessToken, setAccessToken] = useLocalStorage("access_token");
  const [tokenExpiresAt, setTokenExpiresAt] = useLocalStorage("token_expires_at");
  // Salesforce API accessToken
  const [sfAccessToken, setSfAccessToken] = useLocalStorage("sf_access_token");
  const [sfTokenExpiresAt, setSfTokenExpiresAt] = useLocalStorage("sf_token_expires_at");
  const [isSalesforceConnected, setIsSalesforceConnected] = useLocalStorage("is_salesforce_connected");
  const [userName, setUserName] = useState("");
  const [authView, setAuthView] = useState("login");
  const [authProps, setAuthProps] = useState({});

  const handleSetAuthView = (view, props = {}) => {
    setAuthView(view);
    setAuthProps(props);
  };


  // Toast notification for sync feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  // Configurable parameter for sync button autohide
  const syncButtonAutoHide = false; // Set to true to enable autohide functionality

  // Use our custom hook for contact syncing
  const {
    syncContacts,
    isSyncing,
    syncResult,
    syncStats,
    lastSyncTime, // Add this to store the last sync time 
  } = useSyncContacts({ 
    accessToken: accessToken?.access_token 
  });

  useEffect(() => {
    const fetchUserInfo = async (accessToken) => {
      const data = await getUserInfo(accessToken);
      setUserName(data.nickname);
    };

    if (accessToken) {
      fetchUserInfo(accessToken);
    }
  }, []);

  // Handle sync button click
  const handleSyncClick = async () => {
    console.log("[App] Sync contacts button clicked");
    
    try {
      const result = await syncContacts();
      
      // Show toast notification with result
      setToastVariant(result.success ? "success" : "danger");
      setToastMessage(result.message);
      setShowToast(true);
      
      console.log("[App] Sync completed with result:", result);
      if (syncStats) {
        console.log("[App] Sync statistics:", syncStats);
      }
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    } catch (error) {
      console.error("[App] Error handling sync button click:", error);
      setToastVariant("danger");
      setToastMessage(`Sync failed: ${error.message || "Unknown error"}`);
      setShowToast(true);
    }
  };

  // Helper to format last synced time for tooltip
  function formatLastSyncedTime(lastSyncTime) {
    if (!lastSyncTime) return null;
    const now = new Date();
    const last = new Date(lastSyncTime);
    const diffMs = now - last;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMs < 0) return null;
    if (diffSecs < 10) return "Just now";
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    // If more than a day, show date and time
    return `${last.toLocaleDateString()} ${last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Generate tooltip content based on sync state
  const getSyncTooltip = () => {
    if (isSyncing) {
      return (
        <span>
          <strong>Syncing your latest meeting contacts...</strong>
        </span>
      );
    }
    
    let lastSyncDisplay = null;
    // First try to get sync time from syncStats
    if (syncResult && syncStats && syncStats.syncedAt) {
      lastSyncDisplay = formatLastSyncedTime(syncStats.syncedAt);
    } 
    // Only try to use lastSyncTime if it exists (preventing the error)
    else if (syncResult && typeof lastSyncTime !== 'undefined') {
      lastSyncDisplay = formatLastSyncedTime(lastSyncTime);
    }
    
    return (
      <span>
        Press this button to sync your latest meeting contacts
        {lastSyncDisplay && (
          <>
            <br />
            <span style={{ color: '#6c757d', fontSize: '0.95em' }}>
              Contacts synced: {lastSyncDisplay}
            </span>
          </>
        )}
      </span>
    );
  };

  return (
    <div className="main">
      {accessToken && accessToken.access_token && tokenExpiresAt && tokenExpiresAt.token_expires_at > Date.now() ? (
        <div>
          <CMenuTab
            userName={userName}
            accessToken={accessToken.access_token}
            sfAccessToken={sfAccessToken}
            setSfAccessToken={setSfAccessToken}
            sfTokenExpiresAt={sfTokenExpiresAt}
            setSfTokenExpiresAt={setSfTokenExpiresAt}
            isSalesforceConnected={isSalesforceConnected}
            setIsSalesforceConnected={setIsSalesforceConnected}
          />
          
          {/* Toast notification for sync results */}
          <Toast 
            show={showToast} 
            onClose={() => setShowToast(false)}
            className={`sync-toast bg-${toastVariant}`}
            delay={5000}
            autohide
          >
            <Toast.Header closeButton={true}>
              <strong className="me-auto">Contact Sync</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
          
          {/* Sync Contacts Button */}
          <OverlayTrigger placement="top" overlay={
            <Tooltip id="sync-tooltip">{getSyncTooltip()}</Tooltip>
          }>
            <button
              onClick={handleSyncClick}
              className={`sync ${syncButtonAutoHide ? "autohide" : ""} ${isSyncing ? "syncing" : ""}`}
              id="sync-contacts-button"
              disabled={isSyncing}
            >
              <FiRefreshCw className={isSyncing ? "rotating" : ""} />
            </button>
          </OverlayTrigger>
          
          {/* Existing logout button */}
          <CLogout
            setTokenExpiresAt={setTokenExpiresAt}
            setAccessToken={setAccessToken}
            setSfAccessToken={setSfAccessToken}
            sfAccessToken={sfAccessToken}
            setAuthView={setAuthView}
          />
        </div>
      ) : (
        authView === 'signup' ? (
          <VSignup
            setView={handleSetAuthView}
            setAccessToken={setAccessToken}
            setTokenExpiresAt={setTokenExpiresAt}
            {...authProps}
          />
        ) : (
          <VLogin
            setView={handleSetAuthView}
            setAccessToken={setAccessToken}
            setTokenExpiresAt={setTokenExpiresAt}
          />
        )
      )}
    </div>
  );
}

export default App;
