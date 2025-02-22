// pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import HealthcareSection from '../components/HealthcareSection';
import UserPanel from '../components/UserPanel';
import { Outlet } from 'react-router-dom';

const Profile = () => {
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
          {/* <HealthcareSection username={user.username || ''}/> */}
          <Outlet context={{ username: user.username || '' }} />
          <UserPanel username={user.username || ''}/>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Profile;
