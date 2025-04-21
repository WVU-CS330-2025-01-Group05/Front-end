import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './friendRequests.css';

function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/friend-requests`, {
          withCredentials: true,
        });
        setRequests(response.data);
      } catch (err) {
        console.error('Error fetching requests:', err);
        alert('Failed to fetch friend requests');
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
    } catch (err) {
      console.error(`Error trying to ${action} request:`, err);
      alert(`Failed to ${action} request`);
    }
  };

  return (
    <div className="friend-requests-page">
      <div className="request-popup">
        <h2>Friend Requests</h2>

        {requests.length === 0 ? (
          <p className="no-requests">You have no friend requests.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="request-item">
              <p>{req.sender_username} sent you a friend request.</p>
              <div className="buttons">
                <button onClick={() => handleRespond(req.id, 'accept')}>Accept</button>
                <button onClick={() => handleRespond(req.id, 'deny')}>Deny</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FriendRequests;
