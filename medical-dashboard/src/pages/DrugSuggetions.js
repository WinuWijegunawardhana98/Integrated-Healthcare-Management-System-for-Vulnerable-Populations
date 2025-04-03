// pages/Dashboard.js
import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import MedicineCaution from '../components/MedicineCaution';
import DetailsForm from '../components/DetailsForm';

const DrugSuggetions = () => {
  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="details">
          <DetailsForm />
          <MedicineCaution />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default DrugSuggetions;
