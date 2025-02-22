import React, { useState } from 'react';
import { FaPills } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const PrescriptionDetails = () => {
  const location = useLocation();
  const { prescription } = location.state || {};
  const [medicationDetails, setMedicationDetails] = useState(null);
  const [medicationTracking, setMedicationTracking] = useState(
    prescription?.prescriptions?.reduce((acc, medication, index) => {
      acc[index] = medication.frequency.reduce((freqAcc, freq) => {
        freqAcc[freq] = false;
        return freqAcc;
      }, {});
      return acc;
    }, {}) || {}
  );

  const calculateTimeDifference = (dateStr) => {
    const createdDate = new Date(dateStr);
    const now = new Date();
    const diff = now - createdDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days} days, ${hours} hours ago`;
  };

  const handleMedicationSelect = async (medication) => {
    try {
      const response = await fetch('http://localhost:8000/medicine-suggestion-dosage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drug_name: medication.medication_name,
          dosage: medication.dosage,
          frequency: medication.frequency,
        }),
      });
      const data = await response.json();
      setMedicationDetails(data);
    } catch (error) {
      console.error('Error fetching medication details:', error);
      setMedicationDetails({ message: 'Failed to fetch medication details.' });
    }
  };

  const handleToggleFrequency = (medicationIndex, frequency) => {
    setMedicationTracking((prevTracking) => ({
      ...prevTracking,
      [medicationIndex]: {
        ...prevTracking[medicationIndex],
        [frequency]: !prevTracking[medicationIndex][frequency],
      },
    }));
  };

  return (
    <div className="recentOrders">
      <h2>Prescription Details</h2>
      {/* Top Card */}
      <div className="card top-card">
        <div className="card-content">
          <h3>{prescription.title}</h3>
          <p><strong>Description:</strong> {prescription.details}</p>
          <p><strong>Created At:</strong> {new Date(prescription.created_at).toLocaleString()}</p>
          <p><strong>Time Passed:</strong> {calculateTimeDifference(prescription.created_at)}</p>
        </div>
      </div>

      {/* Medicines List */}
      <div className="medication-list">
        {prescription.prescriptions?.map((medication, index) => (
          <div key={index} className="card medication-card">
            <div className="card-content-flex">
              {/* Left Column */}
              <div className="medication-icon">
                <FaPills className='ico' size={30} color="#5cb85c" />
              </div>

              {/* Middle Column */}
              <div className="medication-details">
                <h4>{medication.medication_name}</h4>
                <p><strong>Dosage:</strong> {medication.dosage}</p>
                <p><strong>Frequency:</strong> {medication.frequency.join(', ')}</p>
                <p><strong>Duration:</strong> {medication.duration}</p>

                {/* Frequency Toggles */}
                <div className="frequency-toggles">
                  {medication.frequency.map((freq) => (
                    <div key={freq} className="frequency-toggle">
                      <label>
                        <input
                          type="checkbox"
                          checked={medicationTracking[index][freq] || false}
                          onChange={() => handleToggleFrequency(index, freq)}
                        />
                        {freq}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div className="medication-timing">
                <p><strong>Time Passed:</strong></p>
                <p>{calculateTimeDifference(prescription.created_at)}</p>
                {/* <button className="btn" onClick={() => handleMedicationSelect(medication)}>
                  Get More Details
                </button> */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Medication Details */}
      {medicationDetails && (
        <div className="card medication-details-card">
          <div className="card-content">
            <h3>Dosage Details</h3>
            <p><strong>Suggested Dosage:</strong> {medicationDetails.dosage}mg</p>
            <p><strong>Additional Information:</strong> {medicationDetails.additional_info || 'No additional information available.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetails;
