import React from 'react';
import { Link } from 'react-router-dom';
import { FaApple, FaHome, FaUser, FaRunning, FaHeart, FaHospital, FaFileMedical, FaUserSlash, FaBookMedical } from 'react-icons/fa';

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem('user')); // Retrieve user from localStorage

  if (!user) {
    return null; // Or return a message that the user is not logged in
  }

  return (
    <div className="navigation">
      <ul>
        <li>
          <Link to="#">
            <span className="icon"><FaHospital className="ic" /></span>
            <span className="title">Healthcare</span>
          </Link>
        </li>
        <li>
          <Link to="/logged/dashboard">
            <span className="icon"><FaHeart className="ic" /></span>
            <span className="title">Summary</span>
          </Link>
        </li>
        <li>
          <Link to="/logged/profile">
            <span className="icon"><FaUser className="ic" /></span>
            <span className="title">My Profile</span>
          </Link>
        </li>

        {/* Render Exercise Monitor link only for Patients */}
        {user.role === "Administrator" && (
          <li>
            <Link to="/logged/excercise-schedule">
              <span className="icon"><FaRunning className="ic" /></span>
              <span className="title">Exercise Monitor</span>
            </Link>
          </li>
        )}

        {/* Render Drug Dosage Prediction link for all roles */}
        {/* <li>
          <Link to="/logged/drugs-sugetion">
            <span className="icon"><FaQuestionCircle className="ic" /></span>
            <span className="title">Drug-Dosage Prediction</span>
          </Link>
        </li> */}

        {/* Render Drugs Adherence link for all roles */}
        <li>
          <Link to="/logged/drugs-addherence">
            <span className="icon"><FaFileMedical className="ic" /></span>
            <span className="title">Drugs Addherence</span>
          </Link>
        </li>

        {/* Render User Management link only for Administrators */}
        {user.role === "Administrator" && (
          <li>
            <Link to="/logged/user-management">
              <span className="icon"><FaUserSlash className="ic" /></span>
              <span className="title">User Management</span>
            </Link>
          </li>
        )}
        {user.role === "Administrator" && (
          <li>
            <Link to="/logged/patients-section">
              <span className="icon"><FaBookMedical className="ic" /></span>
              <span className="title">Patients Section</span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
