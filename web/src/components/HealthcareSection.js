import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { useOutletContext } from 'react-router-dom';

const HealthcareSection = () => {
  const { username } = useOutletContext();
  const [userData, setUserData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER}/users/${username}/all`);
        console.log('User & Health Data Response:', response.data);
        setUserData(response.data.user);
        setHealthData(response.data.personal_health);
      } catch (err) {
        console.error('Error fetching user health data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  const handleUpdate = async () => {
    try {
      const response = await axios.post(`${ENV.SERVER}/health`, healthData);
      console.log('Update Response:', response.data);
      alert('Health data updated successfully!');
    } catch (err) {
      console.error('Error updating health data:', err);
      alert('Failed to update health data');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="recentOrders">
      <h2>Healthcare Details</h2>
      <br></br>
      
      {/* User Information Section */}
      <div className="user-info">
        <h3>User Information</h3>
        <p>Full Name: {userData.full_name}</p>
      </div>

      <br></br>

      {/* Health Information Section */}
      <div className="health-info">
        <h3>Health Data</h3>
        {[ 
          { label: 'Family had Heart Diseases', key: 'heart_diseases', type: 'checkbox' },
          { label: 'Previously had Heart Attack', key: 'heart_attack', type: 'checkbox' },
          { label: 'Cholesterol Level (mg/dL)', key: 'cholesterol', type: 'number' },
          { label: 'Diabetes', key: 'diabetes', type: 'checkbox' },
          { label: 'Blood Pressure', key: 'blood_pressure', type: 'text' },
          { label: 'BMI', key: 'bmi', type: 'number' },
          { label: 'Allergies', key: 'allergies', type: 'text' },
          { label: 'Last Checkup', key: 'last_checkup', type: 'text' },
        ].map((field) => (
          <div key={field.key} className="health-inputs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ textAlign: 'left', flex: 1 }}>{field.label}:</label>
            <input 
              type={field.type} 
              checked={field.type === 'checkbox' ? healthData[field.key] : undefined}
              value={field.type !== 'checkbox' ? healthData[field.key] : undefined}
              onChange={(e) => setHealthData({ ...healthData, [field.key]: field.type === 'checkbox' ? e.target.checked : e.target.value })} 
              style={{ flex: 1, textAlign: 'right', padding: '5px' }}
            />
          </div>
        ))}
        
        {/* Age Input (Range) */}
        <div className="health-inputs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ textAlign: 'left', flex: 1 }}>Age:</label>
          <input 
            type="range" 
            min="0" 
            max="120" 
            value={healthData.age || 20} 
            onChange={(e) => setHealthData({ ...healthData, age: parseInt(e.target.value) })} 
            style={{ flex: 1 }}
          />
          <span>{healthData.age || 20}</span>
        </div>

        {/* Gender Select Input */}
        <div className="health-inputs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ textAlign: 'left', flex: 1 }}>Gender:</label>
          <select 
            value={healthData.gender || 'Male'} 
            onChange={(e) => setHealthData({ ...healthData, gender: e.target.value })} 
            style={{ flex: 1, padding: '5px' }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
      
      <button onClick={handleUpdate} className="update-btn" style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Update Health Data</button>
    </div>
  );
};

export default HealthcareSection;
