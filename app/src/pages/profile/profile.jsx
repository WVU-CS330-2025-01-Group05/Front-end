import React, { useState, useEffect } from 'react';
import './profile.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  const [userData, setUserData] = useState({
    username: '',
    numOfHikes: 0,
    bio: 'No Bio Available',
    nameVar: '',
    img: null
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Failed to fetch user data. Please log in again.');
      }
    };

    fetchUserData();
  }, [API_URL, navigate]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('authenticated');
      alert('Logout successful');
      navigate('/home');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Error logging out');
    }
  };

  return (
    <div className='profile'>
      <img
        src={userData.img ? userData.img : require('./default pfp.jpg')}
        alt="profile"
      />

      <a href='/map'><button id='back'>Back to Map</button></a>
      <a href='/friends_list'><button id='friendsList'>Friends List</button></a>
      <a href='/edit'><button id='editProfile'>Edit Profile</button></a>
      <a href='/home'><button id='logOut' onClick={handleLogout}>Log Out</button></a>
      <a href='/friend-requests'><button id='friendRequests'>Friend Requests</button></a>

      <div>
        <p id="name">{userData.nameVar}</p>
        <p id="username">{userData.username}</p>
        <p id="hikes">Hikes Completed: {userData.numOfHikes}</p>
        <label htmlFor="bio">Bio:</label>
        <p id="biography">{userData.bio}</p>
      </div>

      <div className="hikes">
        <p className="completedHike">{userData.nameVar} completed {userData.numOfHikes} hikes!</p>
      </div>
    </div>
  );
}

export default Profile;
