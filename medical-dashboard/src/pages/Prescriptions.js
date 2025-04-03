// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import DetailsForm from '../components/DetailsForm';
import AddPrescription from '../components/AddPrescriptions';
import PrescriptionList from '../components/PrescriptionList';
import PrescriptionDetails from '../components/PrescriptionDetails';

const Prescriptions = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : {};
  });

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
          <PrescriptionDetails />
          <AddPrescription user={user.username || ''}/>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Prescriptions;
