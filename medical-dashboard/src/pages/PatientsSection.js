// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import PatientManagement from '../components/PatientsManagement';
import PatientSummary from '../components/PatientSummary';
import AddPrescription from '../components/AddPrescriptions';
import AddMedication from '../components/AddMedication';
import { Outlet } from 'react-router-dom';

const PatientsSection = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const [selectedUser, setSelectedUser] = useState(null); 

  console.log(selectedUser)

  useEffect(() => {
    if (!user.username) {
      console.warn("User data is not available or invalid.");
    }
  }, [user]);

  const usernameToUse = selectedUser?.username || user.username;
  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="details">
          <Outlet context={{ setSelectedUser, selectedUser }}/>
          {/* <PatientManagement setSelectedUser={setSelectedUser}/> */}
          <AddMedication user={usernameToUse} />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PatientsSection;
