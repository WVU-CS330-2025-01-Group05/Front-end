/**
 * Register.js
 * 
 * This component provides a registration form for new users. It sends 
 * the registration details to the backend, and if successful, redirects to the login page.
 */
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

/**
 * Register component allows new users to create an account.
 * @returns {JSX.Element} The registration form.
 */
const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nameVar, setNameVar] = useState('');
  const [bio] = useState('No Bio');
  const [img] = useState('/default pfp.jpg');
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL || ''; // Fallback for local development
  
  const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
  
    const triggerAlert = (message) => {
      setAlertMessage(message);
      setShowAlert(true);
  
      setTimeout(() => {
        setShowAlert(false);
      }, 2500);
    };
  
  /**
   * Handles form submission by sending registration details to the backend.
   * @param {Object} e - Event object from the form submission.
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      triggerAlert("✖️ Password must be at least 8 characters.");
      return;
    }

    try { 
      const response = await axios.post(
        API_URL + '/auth/register',
        { username, password, bio, nameVar, img },
        { withCredentials: true }
      );

      if (response.data.message === 'User registered successfully') {
        navigate('/login'); // Navigate to map page after registration
      }
      else {
        triggerAlert("✖️ Registration failed. Try different username.");
      }
    } catch (error) {
      console.error('Registration failed:', error);
      triggerAlert('✖️ Error registering user.');
    }
  };

  return (
    <div className="register">
      {showAlert && (
        <div className="custom-alert">
          {alertMessage}
        </div>
      )}
      <div className="register-container">
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
          <h2>Register</h2>
          <input 
            type="text"
            placeholder="Name"
            value={nameVar}
            onChange={(e) => setNameVar(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="buttons">
          <button type="button" onClick={() => navigate('/')}>Back</button>
          <button type="submit">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;