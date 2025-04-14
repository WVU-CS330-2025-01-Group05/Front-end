import React from 'react';
import './login2view.css';
import { useNavigate } from 'react-router-dom';


const Login2View = () => {
  const navigate = useNavigate();
  


  return (
    <div className="login2view">
      <div className="login2view-container">
        <form className="login2view-form">
          <h2>Login Required</h2>
          <p>Please login to view your profile.</p>
          <div className="login2view-buttons">
            <button type="button" onClick={() => navigate('/map')}>Back</button>
            <button type="button" onClick={() => navigate('/login')}>Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login2View;