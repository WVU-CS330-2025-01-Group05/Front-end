import React, { useState, useEffect } from 'react';
import './profile.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function Profile() {
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://cs330-2025-01-group05-backend-fceefzc8c5gfemc7.eastus2-01.azurewebsites.net';
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [selectedTrailId, setSelectedTrailId] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hasFriendRequests, setHasFriendRequests] = useState(false);


  const triggerAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  
    setTimeout(() => {
      setShowAlert(false);
    }, 2500); //
  };
  

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

  const [completedHikes, setCompletedHikes] = useState([]);
  const [trailName, setTrailName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("Trying to fetch user data...");
      try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        triggerAlert('✖️ Failed to fetch user data. Please log in again.');
      }
    };

    fetchUserData();
  }, [API_URL]);


  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/friend-requests`, {
          withCredentials: true,
        });
        setHasFriendRequests(response.data.length > 0);
      } catch (err) {
        console.error('Error fetching friend requests:', err);
        setHasFriendRequests(false);
      }
    };
  
    fetchFriendRequests();
  }, [API_URL]);

  
  useEffect(() => {
    const fetchTrailData = async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/trails`, {}, { withCredentials: true });
        const data = response.data;
        setTrailData(data);
        setTrailData(response.data);
  
        if (data.trail_id && data.status === 'in-progress') {
          const trailNameResponse = await axios.post(`${API_URL}/auth/fetch-trails`, 
            { trailId: data.trail_id }, { withCredentials: true }
          );
          setTrailName(trailNameResponse.data.name);
        } else {
          setTrailName('');
        }
      } catch (error) {
        console.error("No trail data found:", error);
        setTrailData({});
        setTrailName('');
      }
    };
  
    fetchTrailData();
  }, [API_URL]);
  

  useEffect(() => {
    const trailId = trailData.trail_id;
    const fetchTrailName = async () => {
      try {
        if (trailId) {
          const response = await axios.post(`${API_URL}/auth/fetch-trails`, { trailId }, { withCredentials: true });
          setTrailName(response.data.name);
        }
      } catch (error) {
        triggerAlert("✖️ Failed to fetch trail name.");
        console.error("Failed to fetch trail name: ", error);
      }
    };

    if (trailId) {
      fetchTrailName();
    }
  }, [API_URL, trailData.trail_id]);

  useEffect(() => {
    const fetchCompletedHikes = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/completed-hikes`, { withCredentials: true });
        setCompletedHikes(response.data);
      } catch (error) {
        console.error('Failed to fetch completed hikes:', error);
      }
    };

    fetchCompletedHikes();
  }, [API_URL]);

  const refreshProfileData = async () => {
    try {
      const userResponse = await axios.get(`${API_URL}/auth/profile`, { withCredentials: true });
      setUserData(userResponse.data);
  
      const trailResponse = await axios.post(`${API_URL}/auth/trails`, {}, { withCredentials: true });
      setTrailData(trailResponse.data);
  
      if (trailResponse.data.trail_id) {
        const trailNameResponse = await axios.post(`${API_URL}/auth/fetch-trails`, 
          { trailId: trailResponse.data.trail_id }, 
          { withCredentials: true }
        );
        setTrailName(trailNameResponse.data.name);
      } else {
        setTrailName('');
      }
  
      const completedHikesResponse = await axios.get(`${API_URL}/auth/completed-hikes`, { withCredentials: true });
      setCompletedHikes(completedHikesResponse.data);
  
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    }
  };
  
  const handleCompleteHike = async () => {
    try {
      await axios.post(`${API_URL}/auth/complete-trail`, {}, { withCredentials: true });
  
      setSelectedTrailId(trailData.trail_id); // Set the selected trail ID for rating
      setShowRatingPopup(true);
      triggerAlert('🎉 Hike marked as completed!');
    } catch (error) {
      console.error('Failed to complete hike:', error);
      triggerAlert('✖️ Error completing hike.');
    }
  };
  

  const submitRating = async (stars) => {
    try {
      if (stars >= 0 && selectedTrailId) {
        await axios.post(`${API_URL}/auth/rate-trail`, {
          trailId: selectedTrailId,
          rating: stars
        }, { withCredentials: true });
      }
  
      setShowRatingPopup(false);
      await refreshProfileData();
      triggerAlert('Thanks for your feedback!');
    } catch (error) {
      console.error('Failed to submit rating:', error);
      triggerAlert('✖️ Failed to submit rating.');
    }
  };
  


const handleStarClick = (stars) => {
  setSelectedRating(stars);
  submitRating(stars);
};

  
  //same as complete hike but voids it instead
  const handleVoidHike = async () => {
    try {
      await axios.post(`${API_URL}/auth/void-trail`, {}, { withCredentials: true });
      triggerAlert('🗑️ Hike voided successfully.');
      await refreshProfileData();
    } catch (error) {
      console.error('Failed to void hike:', error);
      triggerAlert('✖️ Failed to void hike.');
    }
  };
  
  
  
  

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('authenticated');
      navigate('/home');
    } catch (error) {
      console.error('Logout failed:', error);
      triggerAlert('✖️ Error logging out');
    }
  };

  return (
    <div className='profile'>

{showRatingPopup && (
  <div className="rating-popup">
    <h2 className="rating-title">Rate your experience</h2>


    <div className="stars">
      {[1, 2, 3, 4, 5].map((num) => (
        <span
          key={num}
          onMouseEnter={() => setHoverRating(num)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => handleStarClick(num)}
          style={{ cursor: 'pointer', fontSize: '30px' }}
        >
          {(hoverRating || selectedRating) >= num ? '★' : '☆'}
        </span>
      ))}
    </div>

    <button className="skip-button" onClick={() => submitRating(0)}>Skip</button>
  </div>
)}



      {showAlert && (
  <div className="custom-alert">
    {alertMessage}
  </div>

  
)}
   



      <img
        src={userData.img ? userData.img : require('./default pfp.jpg')}
        alt="profile"
        
      />

      <a href='/map'><button id='back'>Map</button></a>
      <a href='/friends_list'><button id='friendsList'>Friends List</button></a>
      <a href='/edit'><button id='editProfile'>Edit Profile</button></a>
      <a href='/home'><button id='logOut' onClick={handleLogout}>Log Out</button></a>
      <a href='/friend-requests' style={{ position: 'relative' }}>
      <button id='friendRequests'>Friend Requests</button>
         {hasFriendRequests && (
              <div className="notification-badge">!</div>
                 )}        
      </a>


      <div>
        <p id="name">{userData.nameVar}</p>
        <p id="username">@{userData.username}</p>
        <p id="hikes">Hikes Completed: {userData.numOfHikes}</p>
        <label htmlFor="biography">Bio:</label>
        <p id="biography" style={{width: "40%"}}>{userData.bio}</p>

      </div>

      <div className="hikes">
  <h2 className="current-hike-title">Current Hike</h2>

  {trailData && trailData.status === 'in-progress' ? (
    <>
      <div className="current-hike-box">
        <p>{trailName}</p>
        <p>Status: {trailData.status}</p>
        <p>Rating: {trailData.rating || 'N/A'}</p>
      </div>
      <div className="hike-actions">
        <button className="complete" onClick={handleCompleteHike}>Completed Hike</button>
        <button className="void" onClick={handleVoidHike}>Void Hike</button>
      </div>
    </>
  ) : (
    <div className="no-current-hike-box">
      <p></p>
    </div>
  )}
</div>





      <div className="completed-hikes">
        <h2>Completed Hikes</h2>
        {completedHikes.length > 0 ? (
          completedHikes.map((hike, idx) => (
            <p key={idx}>Completed {hike.name} on {new Date(hike.completed_at).toLocaleDateString()}</p>
          ))
        ) : (
          <p>No completed hikes yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
