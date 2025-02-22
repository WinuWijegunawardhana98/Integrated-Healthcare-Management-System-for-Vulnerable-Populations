import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { Bar, Pie } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';

const DrugsManagementView = ({ username }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/medication-all/${username}`);
        console.log('Medications:', response.data);
        setMedications(response.data);
      } catch (err) {
        console.error('Error fetching medications:', err);
        setError('Failed to load medications');
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [username]);

  // Function to prepare data for Bar Chart (Only Taken Medications)
  const prepareBarChartData = () => {
    const medicationCounts = {};
    const labels = new Set(); // Unique dates
    const datasets = [];

    // Process medication records
    medications.forEach((record) => {
      labels.add(record.date);

      record.medications.forEach((med) => {
        if (med.taken) {  // Only count taken medications
          if (!medicationCounts[med.name]) {
            medicationCounts[med.name] = {};
          }

          if (!medicationCounts[med.name][record.date]) {
            medicationCounts[med.name][record.date] = 0;
          }

          medicationCounts[med.name][record.date] += 1;
        }
      });
    });

    // Prepare datasets
    Object.keys(medicationCounts).forEach((medName) => {
      const color = medications[0]?.medications.find((med) => med.name === medName)?.color || "#000000";

      datasets.push({
        label: medName,  // No "(Taken)" label
        data: Array.from(labels).map((date) => medicationCounts[medName][date] || 0),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
      });
    });

    return {
      labels: Array.from(labels),
      datasets: datasets,
    };
  };

  // Function to prepare data for Pie Chart (Missed Medications)
  const preparePieChartData = () => {
    const missedCounts = {};

    // Process medications to count missed ones
    medications.forEach((record) => {
      record.medications.forEach((med) => {
        if (!med.taken) {  // Only count missed medications
          if (!missedCounts[med.name]) {
            missedCounts[med.name] = 0;
          }
          missedCounts[med.name] += 1;
        }
      });
    });

    return {
      labels: Object.keys(missedCounts),  // Medication names
      datasets: [
        {
          data: Object.values(missedCounts),  // Counts
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800'],
          hoverBackgroundColor: ['#FF4C78', '#2A92E5', '#EEC933', '#3E8E41', '#E68500'],
        },
      ],
    };
  };

  const barChartData = prepareBarChartData();
  const pieChartData = preparePieChartData();

  // Chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Medication Count by Date',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Medication Count',
        },
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Missed Medications Over Weak',
        font: {
          size: 18,
        },
      },
    },
  };

  return (
    <div className="recentOrders">
      <h2>Medication Management</h2>

      {/* User Information */}
      <div className="user-info">
        <p>Managing medications for: <strong>{username}</strong></p>
      </div>

      {/* Display error message if any */}
      {error && <p className="error">{error}</p>}

      {/* Display loading indicator */}
      {loading ? (
        <p>Loading medications...</p>
      ) : (
        <div>
          {/* Bar Chart Section */}
          <h3>Medication Count by Date</h3>
          <Bar data={barChartData} options={barChartOptions} />

          {/* Pie Chart Section */}
          <h3>Missed Medications Over Weak</h3>
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      )}
    </div>
  );
};

export default DrugsManagementView;
