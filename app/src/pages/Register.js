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
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Backend API URL

  /**
   * Handles form submission by sending registration details to the backend.
   * @param {Object} e - Event object from the form submission.
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // Send registration details to the backend
      const response = await axios.post(
        API_URL + '/auth/register',
        {
          username,
          password,
          bio: 'No Bio', // Default value for bio
          nameVar: 'John Doe', // Default value for nameVar
        },
        { withCredentials: true }
      );

      if (response.data.message === 'User registered successfully') {
        alert('Registration successful');
        navigate('/map'); // Navigate to map page after registration
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Error registering user. Please ensure all fields are filled out correctly.');
    }
  };

  return (
    <div className="register">
      <div className="register-container">
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="buttons">
            <button type="button" id="back" onClick={() => navigate('/')}>Back</button>
            <button type="submit">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;