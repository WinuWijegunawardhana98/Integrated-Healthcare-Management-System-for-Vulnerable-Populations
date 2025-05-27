import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notiflix from 'notiflix';
import { FiRefreshCcw } from 'react-icons/fi';
import './forms.css';

const SignUp = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    role: 'Patient',
    full_name: '',
    address: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    nic: '',
    speciality: 'No'
  });

  const [errors, setErrors] = useState({});
  const [captcha, setCaptcha] = useState({ question: '', answer: '' });
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpPopupVisible, setOtpPopupVisible] = useState(false);
  const captchaCanvasRef = useRef(null);

  const sendMessage = async (mobile, otp) => {
    const message = `Your OTP code for registration is: ${otp}`;
    try {
      await fetch('https://app.notify.lk/api/v1/send?user_id=29106&api_key=dOrAUpqYTxOQJBtQjcsN&sender_id=NotifyDEMO&to=+94'+mobile.substring(1)+'&message='+message)
        .then((response) => {
          console.log(response);
        });
    } catch (error) {
      console.error('Error:', error); 
    }
  };

  const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit number
    setGeneratedOtp(otp.toString());
    return otp;
  };

  const handleOtpSubmit = () => {
    console.log(otp + '---'+generatedOtp)
    if (otp === generatedOtp) {
      setOtpPopupVisible(false); // Close OTP popup if correct
      handleSubmit();
    } else {
      Notiflix.Notify.failure('Incorrect OTP. Mobile number not verified');
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const canvas = captchaCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captchaString = '';
    
    for (let i = 0; i < 6; i++) {
      captchaString += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setCaptchaText(captchaString);
    
    ctx.font = '30px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < captchaString.length; i++) {
      const x = 30 + i * 25;
      const y = Math.random() * 10 + 30;
      const angle = Math.random() * 0.5 - 0.25;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(captchaString[i], 0, 0);
      ctx.restore();
    }
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  };

  const validateForm = () => {
    let formErrors = {};

    if (!formData.username) formErrors.username = 'Username is required';
    if (!formData.full_name) formErrors.full_name = 'Full Name is required';
    if (!formData.address) formErrors.address = 'Address is required';
    if (!formData.email) formErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) formErrors.email = 'Invalid email format';
    
    if (!formData.contact) formErrors.contact = 'Contact number is required';
    else if (formData.contact.length !== 10 || isNaN(formData.contact)) formErrors.contact = 'Contact number must be 10 digits';
    
    if (!formData.password) formErrors.password = 'Password is required';
    else if (!validatePassword(formData.password)) formErrors.password = 'Password must be at least 8 characters long and include both letters and numbers';

    if (!formData.confirmPassword) formErrors.confirmPassword = 'Confirm Password is required';
    else if (formData.password !== formData.confirmPassword) formErrors.confirmPassword = 'Passwords do not match';

    if (!formData.nic) formErrors.nic = 'NIC is required';

    if (!userCaptchaInput) {
      formErrors.captcha = 'CAPTCHA is required';
    } else if (userCaptchaInput !== captchaText) {
      formErrors.captcha = 'Incorrect CAPTCHA';
      console.log(captchaText +'--'+ userCaptchaInput)
    }

    setErrors(formErrors);
    
    Object.values(formErrors).forEach(error => Notiflix.Notify.warning(error));

    return Object.keys(formErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!otp) {
    //   const otp = generateOtp();
    //   sendMessage(formData.contact, otp); // Send the generated OTP to the user
    //   setOtpPopupVisible(true); // Show OTP popup
    //   return;
    // }
    if (validateForm()) {
      try {
        const obj = {
          username: formData.username,
          role: formData.role,
          full_name: formData.full_name,
          email: formData.email,
          contact: formData.contact,
          password: formData.password,
          nic: formData.nic,
          speciality: formData.role === 'Doctor' ? formData.speciality : 'N/A'
        };

        await axios.post('http://localhost:8000/register', obj);
        Notiflix.Notify.success('Registration successful');
        navigate('/profile-upload', { state: { id: formData.nic, username: formData.username } });
      } catch (error) {
        Notiflix.Notify.failure('Registration failed');
      }
    } else {
      generateCaptcha();
    }
  };

  return (
    <div className="signup-container">
      <div className="sidebar">
        <h2>Join Us</h2>
        <img src={`${process.env.PUBLIC_URL}/anim/register.gif`} alt="Healthcare" />
        <p>Access personalized healthcare services and resources by creating an account with us.</p>
      </div>

      <div className="form-container">
        <h2>Create an Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group row">
            <div className='column'>
              <label>Username</label>
              <input type="text" name="username" placeholder="Enter Username" value={formData.username} onChange={handleChange} />
            </div>
            <div className='column'>
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="Patient">Patient</option>
                <option value="Doctor">Doctor</option>
                <option value="Care Giver">Care Giver</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="full_name" placeholder="Enter Full Name" value={formData.full_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" placeholder="Enter Address" value={formData.address} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>NIC</label>
            <input type="text" name="nic" placeholder="NIC" value={formData.nic} onChange={handleChange} />
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Email</label>
              <input type="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="column">
              <label>Contact Number</label>
              <input type="tel" name="contact" placeholder="Enter Contact Number" value={formData.contact} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group row">
            <div className="column">
              <label>Password</label>
              <input type="password" name="password" placeholder="Enter Password" value={formData.password} onChange={handleChange} />
            </div>
            <div className="column">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" placeholder="Retype Password" value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          {/* CAPTCHA SECTION */}
          <div className="form-group">
            <label>CAPTCHA</label>
            <div className="captcha-container">
              <canvas ref={captchaCanvasRef} width="220" height="40" className="captcha-canvas"></canvas>
              <input
                type="text"
                placeholder="Enter CAPTCHA"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                className="captcha-input"
              />
              <FiRefreshCcw className="captcha-refresh-icon" onClick={generateCaptcha} />
            </div>
            {errors.captcha && <span className="error">{errors.captcha}</span>}
          </div>

          <button type="submit" className="signup-button">Sign Up</button>
          <p className="signin-link">Already have an account? <Link to="/sign-in">Sign In</Link></p>
        </form>
      </div>
      {/* OTP Popup */}
      {otpPopupVisible && (
        <div className="otp-popup" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          width: '300px',
          zIndex: 1000
        }}>
          <div className="otp-popup-content">
            <h3 style={{
              textAlign: 'center',
              fontSize: '18px',
              marginBottom: '20px',
              fontWeight: '600'
            }}>Enter OTP</h3>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '16px'
              }}
            />
            <button
              onClick={handleOtpSubmit}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Submit OTP
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignUp;
