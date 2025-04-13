import React from 'react';
import './profile.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function Profile() {

  const navigate = useNavigate(); // For navigating
  const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Fallback for local development



    //examples
    //need to do (grace): fix variables to match database variables. issue: database variables are in a different file nested in a
  const name = "Lauren Taylor"; 
  const username = "LaurenKate25"; 
  const numOfHikes = 25; 
  const bio = "bio goes here"; 
  const hikeName = "Seneca Rocks";
  const day = "2/14/2025";


  const handleLogout = async() => {

    try {
      //make a POST request to the backend logout endpoint
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });


      // Clear authentication-related data
    localStorage.removeItem('token'); // Remove token from local storage
    localStorage.setItem('authenticated', false); // Update authenticated state
    //alert when successful
    console.log('Logout successful');
    alert('Logout successful');
    navigate('/home'); //redirect to home page
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Error logging out');
  }
};




  return (
    <div className='profile'>
      <img src={require ("./default pfp.jpg")} alt="profile" />

      <a href='/map'><button id='back'>Back to Map</button></a>
      <a href='/friends_list'><button id='friendsList'>Friends List</button></a>
      <a href='/edit'><button id='editProfile'>Edit Profile</button></a>
      <a href='/home'><button id='logOut' /*onClick={handleLogout}*/>Log Out</button></a>

      <div>
        <p id="name">{name}</p>
        <p id="username">@{username}</p>
        <p id="hikes">Hikes Completed: {numOfHikes}</p>
        <label htmlFor="bio">Bio:</label>
        <p id="biography">{bio}</p>
      </div>

      <div className="hikes">
        <p className="completedHike">{name} completed {hikeName} on {day}!</p>
        <p className="completedHike">{name} completed {hikeName} on {day}!</p>
        <p className="completedHike">{name} completed {hikeName} on {day}!</p>
        <p className="completedHike">{name} completed {hikeName} on {day}!</p>
        <p className="completedHike">{name} completed {hikeName} on {day}!</p>
      </div>
    </div>
  );
}

export default Profile;
