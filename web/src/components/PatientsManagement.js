import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { Link } from 'react-router-dom';
import { FaEye, FaTimes } from 'react-icons/fa';
import Notiflix from 'notiflix';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PatientManagement = ({ setSelectedUser }) => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${ENV.SERVER}/health-records/get-all`);
      const allUsers = response.data.users;
      console.log(allUsers)
      const filteredPatients = allUsers.filter(user => user.user.role === 'Patient');
      setPatients(filteredPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (username) => {
    Notiflix.Confirm.show(
      'Confirm Delete',
      `Are you sure you want to delete patient ${username}?`,
      'Yes',
      'No',
      async () => {
        try {
          await axios.delete(`${ENV.SERVER}/users/${username}`);
          Notiflix.Notify.success('Patient deleted successfully');
          fetchPatients();
        } catch (error) {
          Notiflix.Notify.failure('Error deleting patient');
          console.error('Error deleting patient:', error);
        }
      }
    );
  };

  const generatePDF = (patient) => {
    console.log(patient);  // Debugging log

    const doc = new jsPDF();

    // Function to mask NIC (Show first 3 and last 3 digits)
    const maskNIC = (nic) => nic ? nic.replace(/(\d{3})\d+(\d{3})/, '$1****$2') : 'Confidential';

    // Function to mask email (Show first letter & domain)
    const maskEmail = (email) => {
        if (!email) return 'Confidential';
        const [first, domain] = email.split('@');
        return `${first.charAt(0)}****@${domain}`;
    };

    // Function to mask contact (Show first 3 and last 3 digits)
    const maskContact = (contact) => contact ? contact.replace(/(\d{3})\d+(\d{3})/, '$1****$2') : 'Confidential';

    // Title
    doc.setFontSize(18);
    doc.text('Patient Report (Confidential)', 14, 20);

    // Patient Details
    doc.setFontSize(12);
    doc.text('Personal Information:', 14, 30);
    doc.text(`NIC: ${maskNIC(patient.user.nic)}`, 14, 40);
    doc.text(`Full Name: ${patient.user.full_name}`, 14, 50);
    doc.text(`Email: ${maskEmail(patient.user.email)}`, 14, 60);
    doc.text(`Contact: ${maskContact(patient.user.contact)}`, 14, 70);
    doc.text(`Role: ${patient.user.role}`, 14, 80);

    // Personal Health Information
    doc.text('Health Information:', 14, 100);
    doc.autoTable({
        startY: 110,
        head: [['Category', 'Value']],
        body: [
            ['Blood Pressure', patient.personal_health.blood_pressure || 'N/A'],
            ['Diabetes', patient.personal_health.diabetes ? 'Yes' : 'No'],
            ['Heart Attack History', patient.personal_health.heart_attack ? 'Yes' : 'No'],
            ['BMI', patient.personal_health.bmi ? patient.personal_health.bmi : 'N/A'],
            ['Allergies', patient.personal_health.allergies ? patient.personal_health.allergies : 'None']
        ],
        theme: 'striped',
    });

    // Save PDF
    doc.save(`Patient_${patient.user.username}.pdf`);
};


  return (
    <div className="recentOrders" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Patient Management</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Manage patients and their details.</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center' }}>Loading patients...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Full Name</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Contact</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr
                  key={patient.user.username}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                    transition: 'background-color 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'purple')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white')
                  }
                  onClick={() => setSelectedUser(patient.user)}
                >
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.user.username}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.user.full_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.user.email}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.user.contact}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {/* <Link
                      to={`/logged/patient-detail/${patient.user.username}`}
                      style={{ color: '#007bff', marginRight: '10px', transition: 'color 0.3s ease' }}
                      onMouseEnter={(e) => (e.target.style.color = 'green')}
                      onMouseLeave={(e) => (e.target.style.color = '#007bff')}
                    > */}
                      <FaEye size={18}
                      color="blue"
                      style={{ cursor: 'pointer', marginRight: '10px' }}
                      onClick={() => generatePDF(patient)} />
                    {/* </Link> */}
                    <FaTimes
                      size={18}
                      color="red"
                      style={{ cursor: 'pointer', transition: 'color 0.3s ease' }}
                      onMouseEnter={(e) => (e.target.style.color = 'green')}
                      onMouseLeave={(e) => (e.target.style.color = 'red')}
                      onClick={() => handleDelete(patient.user.username)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;
