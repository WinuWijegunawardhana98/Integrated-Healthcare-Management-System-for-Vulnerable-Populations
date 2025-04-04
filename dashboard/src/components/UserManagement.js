import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { Link } from 'react-router-dom';
import { FaEye, FaTimes } from 'react-icons/fa';
import Notiflix from 'notiflix';

const UserManagement = ({setSelectedUser}) => {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async (role = '') => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${ENV.SERVER}/users`, {
        params: { role: role || undefined },
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    fetchUsers(role);
  };

  const handleDelete = async (username) => {
    Notiflix.Confirm.show(
      'Confirm Delete',
      `Are you sure you want to delete user ${username}?`,
      'Yes',
      'No',
      async () => {
        try {
          await axios.delete(`${ENV.SERVER}/users/${username}`);
          Notiflix.Notify.success('User deleted successfully');
          fetchUsers(selectedRole);
        } catch (error) {
          Notiflix.Notify.failure('Error deleting user');
          console.error('Error deleting user:', error);
        }
      }
    );
  };

  return (
    <div className="recentOrders" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>User Management</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        {['', 'Administrator', 'Patient', 'Care Taker', 'Doctor'].map((role) => (
          <button
            key={role}
            onClick={() => handleRoleChange(role)}
            style={{
              padding: '10px 15px',
              margin: '5px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: selectedRole === role ? '#007bff' : '#f0f0f0',
              color: selectedRole === role ? '#fff' : '#000',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {role === '' ? 'All Users' : role}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Manage users and their roles.</p>
        <Link
          to={'/logged/user-add'}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          Add New User
        </Link>
      </div>

      {/* User Table */}
      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center' }}>Loading users...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Full Name</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Role</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Contact</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
                {users.map((user, index) => (
                    <tr
                    key={user.username}
                    style={{
                        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                        transition: "background-color 0.3s ease",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "purple")}
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "white")
                    }
                    onClick={() => setSelectedUser(user)}
                    >
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {user.username.length > 10 ? `${user.username.substring(0, 10)}...` : user.username}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {user.full_name.length > 15 ? `${user.full_name.substring(0, 15)}...` : user.full_name}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {user.email.length > 20 ? `${user.email.substring(0, 20)}...` : user.email}
                    </td>

                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{user.role}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>{user.contact}</td>
                    <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                        <Link
                        to={`/logged/user-detail/${user.username}`}
                        style={{
                            color: "#007bff",
                            marginRight: "10px",
                            transition: "color 0.3s ease",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "green")}
                        onMouseLeave={(e) => (e.target.style.color = "#007bff")}
                        >
                        <FaEye size={18} />
                        </Link>
                        <FaTimes
                        size={18}
                        color="red"
                        style={{
                            cursor: "pointer",
                            transition: "color 0.3s ease",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "green")}
                        onMouseLeave={(e) => (e.target.style.color = "red")}
                        onClick={() => handleDelete(user.username)}
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

export default UserManagement;
