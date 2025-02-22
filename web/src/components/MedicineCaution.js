// components/MedicineCaution.js
import React from 'react';

const MedicineCaution = () => {
  const cautions = [
    { id: 1, text: "Do not mix alcohol with medication." },
    { id: 2, text: "Avoid operating heavy machinery if drowsy." },
    { id: 3, text: "Take medication as prescribed by a healthcare provider." },
    { id: 4, text: "Store medicine out of reach of children." },
    { id: 5, text: "Check expiration date before use." },
  ];

  return (
    <div className="recentCustomers">
      <div className="cardHeader">
        <h2>Medicine & Drug Caution</h2>
      </div>
      <div className='ct-content'>
        <ul className="cautionList">
            {cautions.map((caution) => (
            <li key={caution.id} className="cautionItem">
                <span className="cautionText">{caution.text}</span>
            </li>
            ))}
        </ul>
      </div>
      
    </div>
  );
};

export default MedicineCaution;
