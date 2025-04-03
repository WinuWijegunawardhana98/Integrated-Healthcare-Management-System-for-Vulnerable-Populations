// Home.js
import React from 'react';
import TopNav from '../components/TopNavigation';
import { Link } from 'react-router-dom';
import Notiflix from 'notiflix';
const Home = () => {

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    Notiflix.Confirm.show(
      "Access Restricted",
      "Do you wish to navigate to the dashboard?",
      "Yes",
      "No",
      function okCallback() {
        window.location.href = "/logged/dashboard"; // Navigate to dashboard
      },
      function cancelCallback() {
        // Do nothing, allow user to continue
      }
    );
  }

  return (
    <div className="home-container">
        
      {/* Main Section */}
      <div className="main-section">
        <TopNav/>
        <div className="content">
          <h1>Welcome to Our Healthcare Services</h1>
          <p>
            Providing top-quality healthcare services tailored to your needs. Join us today and 
            experience personalized care with our experienced professionals.
          </p>
          <Link to={'/sign-up'} className="join-button">Join Now</Link>
          {user&&<Link to={'/logged/dashboard'} className="join-button">To Dashbaord</Link>}
        </div>
        <div className="image-section">
          <img src="https://imgvisuals.com/cdn/shop/products/animated-patient-flow-illustration-943688.gif?v=1697071141" alt="Healthcare" />
        </div>
      </div>

      {/* Services Section */}
        <div className="services-section">
            <h2 className='sub-topic'>Our Services</h2>
            <hr className='custom-hr'></hr>
            <br></br>
            <div className='container-hover'>
                <div className='services-card'>
                    <h2>Medical Sesssions</h2>
                    <img src="https://imgvisuals.com/cdn/shop/products/animated-visit-patient-illustration-982108.gif?v=1697071164" alt="Healthcare" />
                    <p>Some Service Informations</p>
                </div>
                <br></br>
                <div className='services-card'>
                    <h2>Patient Monitoring</h2>
                    <img src="https://imgvisuals.com/cdn/shop/products/animated-inpatient-care-illustration-880509.gif?v=1697071125" alt="Healthcare" />
                    <p>Some Service Informations</p>
                </div>
                <br></br>
                <div className='services-card'>
                    <h2>Exercise Monitoring</h2>
                    <img src="https://i.pinimg.com/originals/83/0a/fe/830afe3ea9473a4bb81635874cf0b935.gif" alt="Healthcare" />
                    <p>Some Service Informations</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Home;
