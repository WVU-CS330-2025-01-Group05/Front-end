import React from 'react';
import './loginToView.css';
import { useNavigate } from 'react-router-dom';


const LoginToView = () => {
  const navigate = useNavigate();
  


  return (
    <div className="loginToView">
      <div className="loginToView-container">
        <form className="loginToView-form">
          <h2>Login Required</h2>
          <p>Please login to view your profile.</p>
          <div className="loginToView-buttons">
            <button type="button" onClick={() => navigate('/map')}>Back</button>
            <button type="button" onClick={() => navigate('/login')}>Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginToView;