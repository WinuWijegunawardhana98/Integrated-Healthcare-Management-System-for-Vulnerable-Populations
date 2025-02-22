import React, { useState } from 'react';
import medicationsData from '../data/medicines.json';

const DetailsForm = () => {
  const [healthIssue, setHealthIssue] = useState('');
  const [suggestedMedication, setSuggestedMedication] = useState(null);
  const [medicationDetails, setMedicationDetails] = useState(null); // New state for API response

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert medications data to array format
    const medicationsArray = Object.keys(medicationsData).map(key => ({
      name: key,
      ...medicationsData[key]
    }));

    // Score each medication based on keyword matches with health issue input
    const scores = medicationsArray.map((med) => {
      const matchCount = med.suitableFor.reduce((count, keyword) => {
        return healthIssue.toLowerCase().includes(keyword.toLowerCase()) ? count + 1 : count;
      }, 0);
      return { ...med, score: matchCount };
    });

    // Sort by score in descending order and select the best match
    const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
    setSuggestedMedication(bestMatch.score > 0 ? bestMatch : { message: 'No suitable medication found.' });
  };

  // Handle the API request when medication is selected
  const handleMedicationSelect = async (medication) => {
    if(!medication) return
    try {
        console.log(medication.Details[0]["Dosage Form"])
      const response = await fetch('http://localhost:8000/medicine-suggetion-dosage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drug_name: medication.name,
          category: medication.Category,
          dosage_form: medication.Details[0]["Dosage Form"],
          indication: medication.Details[0].Indication,
          classification: medication.Classification
        }),
      });

      const data = await response.json();
      console.log(data)
      setMedicationDetails(data); // Store the response data
    } catch (error) {
      console.error('Error fetching medication details:', error);
      setMedicationDetails({ message: 'Failed to fetch medication details.' });
    }
  };

  return (
    <div className="recentOrders">
      <h2>User Health Details</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="healthIssue">Health Issue Details</label>
        <textarea
          id="healthIssue"
          placeholder="Describe your symptoms in detail, e.g., sore throat, fever, pain in joints"
          value={healthIssue}
          onChange={(e) => setHealthIssue(e.target.value)}
          required
        />
        <button type="submit" className="btn">Suggest Medication</button>
      </form>

      {suggestedMedication && (<div className="medicationDetails">
        
          <div className="card">
            <>
                {suggestedMedication.Details&&suggestedMedication.Details.length>0&&<img
                  src={suggestedMedication.Details[0].image || 'https://media.istockphoto.com/id/1223737192/vector/medicine-icon-vector-illustration-medicine-vector-illustration-template-medicine-icon-design.jpg?s=612x612&w=0&k=20&c=tyZHi-ZTFsjrQO5dHdftTwRKB3guBaxAkoS-QVoS5Xk='}
                  alt={`${suggestedMedication.name} image`}
                  className="card-image"
                />}
                <div className="card-content">
                  <h3>Suggested Medication</h3>
                  <p><strong>Name:</strong> {suggestedMedication.name}</p>
                  <p><strong>Category:</strong> {suggestedMedication.Category}</p>
                  <p><strong>Strength:</strong> {suggestedMedication.Strength}</p>
                  <p><strong>Classification:</strong> {suggestedMedication.Classification}</p>
                  {suggestedMedication.Details&&suggestedMedication.Details.length>0&&<p><strong>Manufacturer:</strong> {suggestedMedication.Details[0].Manufacturer}</p>}
                  {suggestedMedication.Details&&suggestedMedication.Details.length>0&&<p><strong>Indication:</strong> {suggestedMedication.Details[0].Indication}</p>}
                  {suggestedMedication.Details&&suggestedMedication.Details.length>0&&<p><strong>Dosage Form:</strong> {suggestedMedication.Details[0]["Dosage Form"]}</p>}
                  {suggestedMedication.Details&&suggestedMedication.Details.length>0&&<button className="btn" onClick={() => handleMedicationSelect(suggestedMedication)}>Get More Details</button>}
                </div>
            </>
          </div>
        

        {/* Display the new details from the API response in a third column */}
        {medicationDetails && (
          <div className="card">
            <div className="card-content">
                <h3>Dosage Details</h3>
                <p><strong>Suggested Dosage:</strong> {medicationDetails.dosage}mg</p>
                <p><strong>Additional Information:</strong> {medicationDetails.additional_info || 'No additional information available.'}</p>
            </div>
          </div>
        )}
      </div>)}
    </div>
  );
};

export default DetailsForm;
