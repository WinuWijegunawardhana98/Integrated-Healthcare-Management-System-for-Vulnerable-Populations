import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')); // Get user details from localStorage

  const [isDropdownOpen, setDropdownOpen] = useState(false); // Track dropdown state

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  // Logout function
  const handleLogout = () => {
    localStorage.clear(); // Clear local storage
    navigate('/sign-in'); // Redirect to sign-in page
  };

  return (
    <div style={styles.topbar}>
      <div style={styles.toggle}>
        <ion-icon name="menu-outline"></ion-icon>
      </div>
      <div style={styles.search}>
        <label>
          <input type="text" placeholder="Search here" style={styles.searchInput} />
          <ion-icon name="search-outline" style={styles.searchIcon}></ion-icon>
        </label>
      </div>
      <div style={styles.user} onClick={toggleDropdown}>
        <img
          src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid"
          alt="user"
          style={styles.userImage}
        />
        <span style={styles.username}>{user?.username}</span>
        {isDropdownOpen && (
          <div style={styles.dropdownContainer}>
            <p style={styles.dropdownItem}><strong>{user?.full_name}</strong></p>
            <p style={styles.dropdownItem}><strong>Role:</strong> {user?.role}</p>
            <p style={styles.dropdownItem}><strong>Email:</strong> {user?.email}</p>
            <p style={styles.dropdownItem}><strong>Contact:</strong> {user?.contact}</p>
            <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: '#f4f4f4',
    borderBottom: '2px solid #e0e0e0',
  },
  toggle: {
    fontSize: '24px',
    cursor: 'pointer',
  },
  search: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '5px 15px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    marginRight: '10px',
    padding: '5px',
    fontSize: '14px',
  },
  searchIcon: {
    fontSize: '18px',
    color: '#999',
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  userImage: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  username: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownContainer: {
    position: 'absolute',
    zIndex: '999',
    top: '40px',
    right: '0',
    backgroundColor: '#fff',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    padding: '10px',
    width: '200px',
    animation: 'fadeIn 0.3s ease-in-out', // Animation for dropdown
  },
  dropdownItem: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#555',
  },
  logoutButton: {
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#d9534f',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px',
  },
};

export default Topbar;
