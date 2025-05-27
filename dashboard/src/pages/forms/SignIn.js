import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './forms.css';
import axios from 'axios';
import Notiflix from 'notiflix';

const SignIn = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.password) {
      Notiflix.Notify.failure('Username and Password are required');
      return;
    }

    setLoading(true); 

    try {
      const response = await axios.post('http://localhost:8000/login', formData);
      Notiflix.Notify.success('Login successful');
      const response2 = await axios.post('http://localhost:8000/face-detection/recognize', {username:formData.username});
      // console.log(response2.data)
      if(response2.data&&response.data){
        if(response2.data.detected){
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/logged/dashboard')
        }
      }
      
      // Redirect to home page
    } catch (error) {
      Notiflix.Notify.failure(error.response.data.detail);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="signup-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Welcome Back</h2>
        <img src={`${process.env.PUBLIC_URL}/anim/login.gif`} alt="Healthcare" />
        <p>Access your personalized healthcare services by logging into your account.</p>
      </div>

      {/* Form Section */}
      <div className="form-container">
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input type="text" name="username" placeholder="Enter Username or Email" onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter Password" onChange={handleChange} />
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? <div className="loading-icon">
            <div className="spinner"></div>
          </div> : 'Sign In'}
          </button>
          <p className="signin-link">Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
          <p className="forgot-password-link"><Link to="/forgot-password">Forgot Password?</Link></p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
