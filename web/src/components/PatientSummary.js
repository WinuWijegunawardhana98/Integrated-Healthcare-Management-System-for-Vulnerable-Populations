import React, { useState, useEffect } from "react";
import axios from "axios";
import ENV from "../data/Env";

const PatientSummary = ({ selectedUser }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Function to fetch logs for the user
  const fetchUserLogs = async (username) => {
    if (!username) {
      setErrorMessage("No user provided");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${ENV.SERVER}/user/${username}/logs`);
      setLogs(response.data.logs);
      setErrorMessage("");
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setErrorMessage("No logs found for this user");
      } else {
        setErrorMessage("Error fetching logs");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch logs when selectedUser is available
  useEffect(() => {
    if (selectedUser && selectedUser.username) {
      fetchUserLogs(selectedUser.username);
    }
  }, [selectedUser]);

  // Prevent rendering if selectedUser is null
  if (!selectedUser) {
    return (
      <div className="recentCustomers">
        <p>Select a user to view logs.</p>
      </div>
    );
  }

  return (
    <div className="recentCustomers">
      <div className="cardHeader">
        <h2>{selectedUser.username}</h2>
      </div>

      {/* Show error message if any */}
      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Show loading message while fetching logs */}
      {isLoading && <p>Loading logs...</p>}

      {/* Logs ListView (cards) */}
      {!isLoading && !errorMessage && logs.length > 0 && (
        <div className="ct-content">
          {logs.map((log, index) => (
            <div
              key={log.id}
              style={{
                marginBottom: "15px",
                padding: "10px",
                borderRadius: "10px",
                backgroundColor: index % 2 === 0 ? "#f4f4f4" : "#ffffff", // Even card color
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <p
                style={{
                  fontSize: "12px", // smaller text for timestamp
                  color: "#888",
                  marginBottom: "5px",
                }}
              >
                {new Date(log.timestamp).toLocaleString()}
              </p>
              <p
                style={{
                  fontSize: "14px", // action text
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {log.action}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No logs message */}
      {!isLoading && !errorMessage && logs.length === 0 && (
        <p>No logs available for this user.</p>
      )}
    </div>
  );
};

export default PatientSummary;
