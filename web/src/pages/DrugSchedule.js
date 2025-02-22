// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import DetailsForm from '../components/DetailsForm';
import AddPrescription from '../components/AddPrescriptions';
import PrescriptionList from '../components/PrescriptionList';
import PrescriptionNotes from '../components/PrescriptioNotes';
import MedicationSchedule from '../components/MedicationsList';

const DrugSchedule = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : {};
  });

  console.log(localStorage.getItem('user'))

  useEffect(() => {
    if (!user.username) {
      console.warn("User data is not available or invalid.");
    }
  }, [user]);
  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="details">
          <MedicationSchedule user={user.username || ''}/>
          <AddPrescription user={user.username || ''}/>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default DrugSchedule;
