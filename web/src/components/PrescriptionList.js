import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ENV from "../data/Env";

const PrescriptionList = ({ user }) => {
  const navigate = useNavigate();  
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/prescription/${user}`);
        setPrescriptions(response.data.prescriptions);
        setLoading(false);
      } catch (err) {
        setError("Failed to load prescriptions.");
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  const handlePrescriptionClick = (prescription) => {
    navigate("/logged/drugs-addherence/"+prescription.id, { state: { prescription } }); 
  };

  const calculateTimeDifference = (dateStr) => {
    const createdDate = new Date(dateStr);
    const now = new Date();
    const diff = now - createdDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days} days, ${hours} hours ago`;
  };

  if (loading) {
    return <div>Loading prescriptions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="recentOrders">
      <h2>Prescription List of {user}</h2>
      <div className="exercise-list">
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="exercise-card" onClick={() => handlePrescriptionClick(prescription)}>
              <div className="prescription-details">
                <h3>{prescription.title}</h3>
                <p>{prescription.details}</p>
                <small>
                  <strong>Created At:</strong> {formatDate(prescription.created_at)}<br />
                  <strong>Time Passed:</strong> {calculateTimeDifference(prescription.created_at)}
                </small>
              </div>
              <div className="prescription-medications">
                <h4>Medications</h4>
                <ul>
                  {prescription.prescriptions?.map((med, index) => (
                    <li key={index}>
                      {med.medication_name} - {med.dosage} ({med.duration}) -{" "}
                      {med.frequency.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        ) : (
          <p>No prescriptions found for this user.</p>
        )}
      </div>
    </div>
  );
};

export default PrescriptionList;
