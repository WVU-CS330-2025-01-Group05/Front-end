import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FriendProfile.css';


function FriendProfile() {
  const { id } = useParams();
  const [friendData, setFriendData] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/profile/${id}`, {
          withCredentials: true,
        });
        setFriendData(response.data);
      } catch (error) {
        console.error('Failed to fetch friend profile:', error);
        navigate('/friends_list');
      }
    };
    fetchFriendData();
  }, [API_URL, id, navigate]);

  if (!friendData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="friend-profile-page">
  <img className="friend-profile-img" src={friendData.img ? friendData.img : require('./default pfp.jpg')} alt="profile" />
  <h1 className="friend-profile-name">{friendData.nameVar}</h1>
  <h2 className="friend-profile-username">@{friendData.username}</h2>
  <div className="friend-profile-bio">Bio: {friendData.bio}</div>
  <div className="friend-profile-hikes">Hikes Completed: {friendData.numOfHikes}</div>

  <a href='/friends_list'><button className="friend-back-button">Back to Friends</button></a>
</div>

  );
}

export default FriendProfile;
