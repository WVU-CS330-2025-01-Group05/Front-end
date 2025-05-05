import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './friendRequests.css';

function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'https://cs330-2025-01-group05-backend-fceefzc8c5gfemc7.eastus2-01.azurewebsites.net';

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/friend-requests`, {
          withCredentials: true,
        });
        setRequests(response.data);
      } catch (err) {
        console.error('Error fetching requests:', err);
      }
    };

    fetchRequests();
  }, [API_URL]);

  const handleRespond = async (requestId, action) => {
    const endpoint = action === 'accept' ? 'accept-request' : 'deny-request';

    try {
      await axios.post(`${API_URL}/auth/${endpoint}`, { requestId }, {
        withCredentials: true,
      });

      // Remove the handled request from the list
      setRequests(prev => prev.filter(r => r.id !== requestId));

      // If accepted, trigger update on friends list
      if (action === 'accept') {
        window.dispatchEvent(new Event("friendsUpdated"));
      }
    } catch (err) {
      console.error(`Error trying to ${action} request:`, err);
    }
  };

  return (
    <div className="friend-requests-page">
      <a href='/profile'><button className='friendReq-back'>Account</button></a>

      <div className="request-popup">
        <h2>Friend Requests</h2>

        {requests.length === 0 ? (
          <p className="no-requests">You have no friend requests.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="request-item">
              <p>{req.sender_username} sent you a friend request.</p>
              <div className="reqButtons">
                <button id='accept' onClick={() => handleRespond(req.id, 'accept')}>Accept</button>
                <button id='deny' onClick={() => handleRespond(req.id, 'deny')}>Deny</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FriendRequests;
