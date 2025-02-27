import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import Card from '../components/Card';
import PersonalHeartRate from '../components/PersonalHeartRate';
import { db } from '../data/Firebase';
import { ref, onValue } from "firebase/database";
import PersonalPredictions from '../components/PersonalPredictions';

const Dashboard = () => {
  const [healthData, setHealthData] = useState({
    bpm: 0,
    fahrenheit: 0,
    spo2: 0,
    beatAvg: 0,
    tance: 0,
    degreeC: 0,
    ecg: 0
  });

  useEffect(() => {
    // References for each health data
    const bpmRef = ref(db, 'bpm');
    const fahrenheitRef = ref(db, 'Farenheit');
    const spo2Ref = ref(db, 'spo2');
    const beatAvgRef = ref(db, 'beatAvg');
    const tanceRef = ref(db, 'tance');
    const degreeCRef = ref(db, 'DegreeC'); 
    const ecgCRef = ref(db, 'ecg'); 

    const intervalId = setInterval(() => {
      // Fetch bpm value
      onValue(ecgCRef, (snapshot) => {
        if (snapshot.exists()) {
          setHealthData((prevState) => ({
            ...prevState,
            ecg: snapshot.val(),
          }));
        }
      });

      onValue(bpmRef, (snapshot) => {
        if (snapshot.exists()) {
          setHealthData((prevState) => ({
            ...prevState,
            bpm: snapshot.val(),
          }));
        }
      });

      // Fetch fahrenheit value
      onValue(fahrenheitRef, (snapshot) => {
        if (snapshot.exists()) {
          const fahrenheitValue = snapshot.val();
          const roundedFahrenheit = parseFloat(fahrenheitValue).toFixed(2); // Round to 2 decimal points
          setHealthData((prevState) => ({
            ...prevState,
            fahrenheit: roundedFahrenheit,
          }));
        }
      });

      // Fetch spo2 value
      onValue(spo2Ref, (snapshot) => {
        if (snapshot.exists()) {
          setHealthData((prevState) => ({
            ...prevState,
            spo2: snapshot.val(),
          }));
        }
      });

      // Fetch beatAvg value
      onValue(beatAvgRef, (snapshot) => {
        if (snapshot.exists()) {
          setHealthData((prevState) => ({
            ...prevState,
            beatAvg: snapshot.val(),
          }));
        }
      });

      // Fetch tance value
      onValue(tanceRef, (snapshot) => {
        if (snapshot.exists()) {
          setHealthData((prevState) => ({
            ...prevState,
            tance: snapshot.val(),
          }));
        }
      });

      // Fetch DegreeC value
      onValue(degreeCRef, (snapshot) => {
        if (snapshot.exists()) {
          const degreeCValue = snapshot.val();
          setHealthData((prevState) => ({
            ...prevState,
            degreeC: parseFloat(degreeCValue).toFixed(2), // Round to 2 decimal points
          }));
        }
      });
    }, 1000); // Fetch data every 1 second

    // Cleanup interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="cardBox">
          {/* <Card numbers={`${healthData.bpm} bpm`} cardName="Heart Rate" icon="heart-outline" /> */}
          <Card numbers={`${healthData.fahrenheit}°F`} cardName="Body Temperature" icon="thermometer-outline" />
          <Card numbers={`${healthData.spo2}%`} cardName="Oxygen Level" icon="pulse-outline" />
          <Card numbers={`${healthData.beatAvg} bpm`} cardName="Avg Heart Rate" icon="speedometer-outline" />
          <Card numbers={`${healthData.tance}`} cardName="Tance" icon="trending-up-outline" />
        </div>
        <div className="details">
          <PersonalHeartRate />
          {/* Pass bpm, beatAvg, and degreeC to PersonalPredictions component */}
          <PersonalPredictions ecg={healthData.ecg} spo2={healthData.spo2} bpm={healthData.bpm} beatAvg={healthData.beatAvg} degreeC={healthData.degreeC} />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
