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

  const [trailData, setTrailData] = useState({
    trail_id: 0,
    status: '',
    rating: 0,
    completed_at: ''
  });

  /*
  const [trailInfo, setTrailInfo] = useState({
    name: '',
    miles: 0.0,
    total_rating: 0,
    rating_count: 0
  });
  */
  const trailId = trailData.trail_id;
  const [trailName, setTrailName] = useState('');

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

  useEffect(() => {
    const fetchTrailData = async () => {
      try {
        const response = await axios.get(API_URL + '/auth/trails', {withCredentials: true});
        setTrailData(response.data);
      } catch (error) {
        alert("Failed to fetch trail data.");
        console.error("Failed to fetch trail data: ", error);
      }
    };

    fetchTrailData();
  }, [API_URL]);

  useEffect(() => {
    const fetchTrailName = async () => {
      try {
        const response = await axios.get(API_URL + '/auth/fetch-trails', {trailId}, {withCredentials: true});
        setTrailName(response.data);
      } catch (error) {
        alert("Failed to fetch trail name.");
        console.error("Failed to fetch trail name: ", error);
      }
    };

    fetchTrailName();
  }, [API_URL]);

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
        <p id="username">@{userData.username}</p>
        <p id="hikes">Hikes Completed: {userData.numOfHikes}</p>
        <label htmlFor="bio">Bio:</label>
        <p id="biography">{userData.bio}</p>
      </div>

      <div className="hikes">
        <p id="completedHike">{trailData.trail_id}, {trailData.status}, {trailData.rating}, {trailData.completed_at}</p>
      </div>
    </div>
  );
}

export default Profile;
