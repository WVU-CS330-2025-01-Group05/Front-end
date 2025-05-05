/**
 * Login.js
 * 
 * This component provides a login form that authenticates the user.
 * Upon successful login, it updates the authentication state and navigates to the map page.
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

/**
 * Login component allows users to enter credentials to access the app.
 * @param {Function} setAuthenticated - Function to update the app's authentication state.
 * @returns {JSX.Element} The login form.
 */
const Login = ({ setAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Fallback for local development

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
   * handleSubmit
   * 
   * Handles form submission by sending credentials to the backend for verification.
   * Updates authentication state and navigates to the map page upon success.
   * 
   * @param {Object} e - Event object from the form submission.
   * @async
   * @function
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try { 
      const response = await axios.post(
        API_URL + '/auth/login',
        { username, password },
        { withCredentials: true }
      );

      if (response.data.message === 'Login successful') {
        setAuthenticated(true);
        navigate('/'); // Redirect to main page
      } else {
        triggerAlert('✖️ Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      triggerAlert('✖️ Invalid credentials');
    }
  };

  return (
    <div className="login">
      {showAlert && (
        <div className="custom-alert">
          {alertMessage}
        </div>
      )}
      <div className="login-container">
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
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
            <div className="button-group">
              <button type="button" onClick={() => navigate('/')}>Back</button>
              <button type="submit">Login</button>
            </div>
          </form>

          {/* Link to the Register page */}
          <p style={{ marginTop: '10px' }}>
            Don’t have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
