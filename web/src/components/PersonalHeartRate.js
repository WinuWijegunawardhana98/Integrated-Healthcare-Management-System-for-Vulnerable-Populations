import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../data/Firebase';
import { ref, onValue } from "firebase/database";

// Registering necessary chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const PersonalHeartRate = () => {
  const [heartRates, setHeartRates] = useState([]); // Array to store heart rate data over time
  const [timestamps, setTimestamps] = useState([]); // Array to store timestamps
  const [records, setRecords] = useState([]); // Array to store data for the table
  const [ecgValues, setEcgValues] = useState([]); // Array to store ECG data over time
  const [ecgLineColor, setEcgLineColor] = useState([]); // Array to store ECG line color

  useEffect(() => {
    const bpmRef = ref(db, 'BPM'); // Replace with the correct path to bpm in your Firebase database
    const ecgRef = ref(db, 'ecg'); // Path to the ECG data in your Firebase database

    // Start interval to capture bpm and ecg data every second
    const interval = setInterval(() => {
      onValue(bpmRef, (snapshot) => {
        const bpmValue = snapshot.val();
        const currentTime = new Date().toLocaleTimeString();

        // Update heart rate chart data with the last 7 entries
        setHeartRates((prevRates) => [...prevRates, bpmValue]);
        setTimestamps((prevTimestamps) => [...prevTimestamps, currentTime]);

        // Update table records
        setRecords((prevRecords) => [
          ...prevRecords,
          { time: currentTime, bpm: bpmValue },
        ]);
      });

      onValue(ecgRef, (snapshot) => {
        const ecgValue = snapshot.val();
        const currentTime = new Date().toLocaleTimeString();

        // ECG value thresholds
        const thresholdNormalMin = 0.08;
        const thresholdNormalMax = 0.12;
        let lineColor = 'green'; // Default to healthy

        if (ecgValue < thresholdNormalMin || ecgValue > thresholdNormalMax) {
          lineColor = 'yellow'; // Risky if the value is outside normal range
        }
        if (ecgValue > thresholdNormalMax) {
          lineColor = 'red'; // Higher risk if the value exceeds prolonged threshold
        }

        // Update ECG data and line color
        setEcgValues((prevEcgValues) => [...prevEcgValues, ecgValue]);
        setEcgLineColor((prevLineColors) => [...prevLineColors, lineColor]);
      });
    }, 1000); // Capture data every second

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [heartRates, ecgValues]);

  const heartRateData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: heartRates,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const heartRateOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
        },
      },
      title: {
        display: true,
        text: 'Heart Rate Monitoring (Real-time)',
        color: '#333',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#333',
        },
        title: {
          display: true,
          text: 'Time',
          color: '#333',
        },
      },
      y: {
        ticks: {
          color: '#333',
        },
        title: {
          display: true,
          text: 'Heart Rate (BPM)',
          color: '#333',
        },
        beginAtZero: true,
      },
    },
  };

  const ecgData = {
    labels: timestamps,
    datasets: [
      {
        label: 'ECG Value',
        data: ecgValues,
        backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent background
        borderColor: ecgLineColor, // Dynamic line color based on the condition
        borderWidth: 2,
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const ecgOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
        },
      },
      title: {
        display: true,
        text: 'ECG Monitoring (Real-time)',
        color: '#333',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#333',
        },
        title: {
          display: true,
          text: 'Time',
          color: '#333',
        },
      },
      y: {
        ticks: {
          color: '#333',
        },
        title: {
          display: true,
          text: 'ECG Value',
          color: '#333',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="recentOrders">
      <div className="cardHeader">
        <h2>Heart Rate Monitoring (BPM)</h2>
        <a href="#" className="btn">View All</a>
      </div>
      <div className="chartContainer">
        <Line data={heartRateData} options={heartRateOptions} />
      </div>

      <div className="cardHeader">
        <h2>ECG Monitoring (Real-time)</h2>
        <a href="#" className="btn">View All</a>
      </div>
      <div className="chartContainer">
        <Line data={ecgData} options={ecgOptions} />
      </div>
    </div>
  );
};

export default PersonalHeartRate;
