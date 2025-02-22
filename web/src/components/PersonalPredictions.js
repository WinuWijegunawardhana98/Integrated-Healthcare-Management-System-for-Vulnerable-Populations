import React, { useState, useEffect } from 'react';
import ENV from '../data/Env';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const PersonalPredictions = ({ bpm, beatAvg, degreeC, ecg, spo2 }) => {
  const [risk, setRisk] = useState(null);
  const [previousRisks, setPreviousRisks] = useState([]);
  const [message, setMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [userLocation, setUserLocation] = useState({ lat: 6.18543, lng: 80.27826 });
  const [icon, setIcon] = useState(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    // Function to fetch health prediction data
    const fetchRiskData = async () => {
      try {
        const response = await axios.post(ENV.SERVER+'/predict-health-risk', {
          age: 30, // Replace with actual age value
          gender: 'Male', // Replace with actual gender value
          family_history: 'Yes', // Replace with actual family history
          systolic_bp: bpm, // Replace with actual systolic value
          diastolic_bp: beatAvg, // Replace with actual diastolic value
          heart_rate: beatAvg, // Pass bpm here
        });
        if (response.data && response.data["Predicted Disease Risk (%)"]) {
          const newRisk = response.data["Predicted Disease Risk (%)"];
          setRisk(newRisk);
          
          // Track the last few risk values
          setPreviousRisks((prevRisks) => {
            const updatedRisks = [...prevRisks, newRisk];
            if (updatedRisks.length > 5) {
              updatedRisks.shift(); // Keep only the last 5 values
            }
            return updatedRisks;
          });
        }
      } catch (error) {
        console.error("Error fetching risk data:", error);
      }
    };

    // Fetch the risk data every 5 seconds
    const intervalId = setInterval(fetchRiskData, 5000); 

    

    return () => clearInterval(intervalId);
  }, [bpm]);

  useEffect(() => {
    // Simulate loading for 2 seconds after the component is loaded
    const timer = setTimeout(() => {
      setLoading(true);
    }, 2000); // 2000ms = 2 seconds

    // Clean up the timer when the component is unmounted
    return () => clearTimeout(timer);
  }, [])

  useEffect(() => {
    // Check if risk remains constant for consecutive times
    if (previousRisks.length >= 5) {
      const allEqual = previousRisks.every(risk => risk === previousRisks[0]);
      if (allEqual) {
        setMessage('The risk value remains consistent. Please check if the device is properly connected.');
      }
    }

    // Check if risk has been continuously increasing for the last 5 times
    const isIncreasing = previousRisks.length >= 5 && previousRisks.every((val, index) => index === 0 || val > previousRisks[index - 1]);
    if (isIncreasing) {
      setWarningMessage('Risk value is continuously increasing. Please calm down or take appropriate measures.');
    }

    // Display message if risk is over 80%
    if (risk > 80) {
      setWarningMessage(prevMessage => prevMessage + ' Please contact a health professional immediately.');
    }
  }, [previousRisks, risk]);

  useEffect(() => {
    if (window.google) {
      setIcon({
        url: "https://play-lh.googleusercontent.com/5WifOWRs00-sCNxCvFNJ22d4xg_NQkAODjmOKuCQqe57SjmDw8S6VOSLkqo6fs4zqis",
        scaledSize: new window.google.maps.Size(40, 40),
      });
    }
  }, []);

  return (
    <div className="recentCustomers">
      <div className="cardHeader">
        <h2>Prediction Summary</h2>
      </div>
      <br></br><br></br>
      <div className="predictionCard" style={{textAlign: 'center'}}>
      <div className="speedometer">
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Background Arc */}
            <path
              d="M10,110 A90,90 0 0,1 190,110"
              stroke="#ddd"
              strokeWidth="15"
              fill="none"
            />

            {/* Dynamic Arc */}
            <path
              d="M10,110 A90,90 0 0,1 190,110"
              stroke={
                risk > 80 ? "#e74c3c" : risk > 50 ? "#f39c12" : "#2ecc71"
              }
              strokeWidth="15"
              fill="none"
              strokeDasharray="180"
              strokeDashoffset={180 - (180 * risk) / 100}
              className="gauge"
            />

            {/* Needle */}
            <line
              x1="100"
              y1="110"
              x2={100 + 80 * Math.cos((Math.PI * (risk - 50)) / 100)}
              y2={110 - 80 * Math.sin((Math.PI * (risk - 50)) / 100)}
              stroke="red"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Center Circle */}
            <circle cx="100" cy="110" r="8" fill="black" />
          </svg>

          {/* Percentage Display */}
          {/* <div className="risk-text">{risk}%</div> */}
        </div>
        <span style={{ fontSize: '4em', fontWeight: 'bold', color: risk > 80 ? 'red' : 'black' }}>{risk}%</span>
        <h3>{risk > 70 ? 'Positive Heart Disease Risk' : 'Negative Heart Disease Risk'}</h3>
        <br></br>
        {message && <p style={{ color: '#f39c12', fontWeight: 'bold' }}>{message}</p>}
        {warningMessage && <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>{warningMessage}</p>}
      </div>

      <div style={{ borderRadius: '10px', overflow: 'hidden', width: '250px', height: '250px', margin: '10px' }}>
          {loading&&<LoadScript googleMapsApiKey="AIzaSyDAsJYZSQ92_NQAz9kiSpW1XpyuCxRl_uI">
            <GoogleMap
              mapContainerStyle={{ width: '250px', height: '250px' }}
              center={userLocation}
              zoom={15}
            >
              {icon&&<Marker position={userLocation} icon={icon} />}

            </GoogleMap>
          </LoadScript>}
      </div>
      
    </div>
  );
};

export default PersonalPredictions;
