import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ENV from "../data/Env";

const AddPrescription = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${user}/all`);
        console.log(response.data);
        setUserData(response.data.user);
        setHealthData(response.data.personal_health);
      } catch (err) {
        console.error("Error fetching user health data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (healthData) {
      const fetchRiskData = async () => {
        try {
          const response = await axios.post(`${ENV.SERVER}/predict-health-risk`, {
            age: healthData.age || 30,
            gender: healthData.gender || "Male",
            family_history: "Yes", // Dummy value for now
            systolic_bp: parseInt(healthData.blood_pressure?.split("/")[0]) || 120,
            diastolic_bp: parseInt(healthData.blood_pressure?.split("/")[1]) || 80,
            heart_rate: healthData.bmi || 70, // Using BMI as a placeholder
          });
          if (response.data && response.data["Predicted Disease Risk (%)"]) {
            setRisk(response.data["Predicted Disease Risk (%)"]);
          }
        } catch (error) {
          console.error("Error fetching risk data:", error);
        }
      };
      fetchRiskData();
    }
  }, [healthData]);

  const getRiskColor = (risk) => {
    if (risk <= 50) return "green";
    if (risk <= 75) return "yellow";
    return "red";
  };

  const links = [
    { name: "View Schedule", path: "/logged/drugs-addherence/schedule" },
    { name: "Add New Prescription", path: "/logged/drugs-addherence" },
    { name: "Manage Medicines", path: "/logged/drugs-management" },
  ];

  return (
    <div className="recentCustomers" style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "15px", textAlign: "center" }}>User Health Info</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {healthData && (
        <div style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <p><strong>Age:</strong> {healthData.age}</p>
          <p><strong>Blood Pressure:</strong> {healthData.blood_pressure}</p>
          <p><strong>BMI:</strong> {healthData.bmi}</p>
          <p><strong>Cholesterol:</strong> {healthData.cholesterol}</p>
          <p><strong>Diabetes:</strong> {healthData.diabetes ? "Yes" : "No"}</p>
          <p><strong>Gender:</strong> {healthData.gender}</p>
          <p><strong>Heart Attack:</strong> {healthData.heart_attack ? "Yes" : "No"}</p>
          <p><strong>Heart Diseases:</strong> {healthData.heart_diseases ? "Yes" : "No"}</p>
          <p><strong>Last Checkup:</strong> {healthData.last_checkup || "N/A"}</p>
          <p><strong>User:</strong> {healthData.user}</p>
        </div>
      )}
      {risk !== null && (
        <div style={{textAlign:'center'}}>
        <p>Predicted Disease Risk</p>
        <h3 style={{ textAlign: "center", color: getRiskColor(risk), fontSize: "35px" }}>
          {risk}%
        </h3>
        </div>
      )}
      <br></br>
      <br></br>
      <h2 style={{ marginBottom: "15px", textAlign: "center" }}>Links</h2>
      {links.map((link, index) => (
        <Link
          key={index}
          to={link.path}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            textAlign: "center",
            backgroundColor: "#007bff",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background-color 0.3s, transform 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
          onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
};

export default AddPrescription;