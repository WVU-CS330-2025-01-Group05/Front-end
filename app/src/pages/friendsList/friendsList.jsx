import React, { useState, useEffect } from "react";
import axios from "axios";
import './friendsList.css';

function FriendsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [noResults, setNoResults] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [friends, setFriends] = useState([]);
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const triggerAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);

    setTimeout(() => {
      setShowAlert(false);
    }, 2500);
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/friends`, {
        withCredentials: true,
      });
      setFriends(response.data);
    } catch (err) {
      console.error("Error loading friends list:", err);
    }
  };

  useEffect(() => {
    fetchFriends();

    window.addEventListener("friendsUpdated", fetchFriends);
    return () => window.removeEventListener("friendsUpdated", fetchFriends);
  }, [API_URL]);

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      triggerAlert("Please enter a username to search.");
      return;
    }

    try {
      setNoResults(false);
      const response = await axios.get(`${API_URL}/auth/search-users`, {
        params: { query: searchQuery },
        withCredentials: true,
      });
      setSearchResults(response.data);
      setNoResults(response.data.length === 0);
    } catch (error) {
      console.error("Error searching users:", error);
      triggerAlert("Failed to fetch user data. Please try again.");
    }
  };

  const handleSendFriendRequest = async () => {
    const isAlreadyFriend = friends.some(friend => friend.username === selectedUser.username);
    if (isAlreadyFriend) {
      triggerAlert("Already friends with this user.");
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/send-request`, {
        receiverId: selectedUser.id
      }, { withCredentials: true });
      setRequestSent(true);
      triggerAlert("Friend request sent!");
    } catch (err) {
      console.error("Error sending request:", err);
      triggerAlert("Failed to send friend request.");
    }
  };

  return (
    <div className="friends-page">
      {showAlert && (
        <div className="custom-alert">
          {alertMessage}
        </div>
      )}

      <a href='/profile'><button className='friend-back'>Account</button></a>

      <div className="container">
        <button
          className="add-friend-button"
          onClick={() => setShowSearchPopup(true)}
        >
          Add Friend
        </button>

        <div className="friendsHeader">
          <span>Friends</span>
        </div>
        <div className="friends">
          {friends.length === 0 ? (
            <p style={{ color: '#999' }}>No friends yet.</p>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="friend">
                <div>{friend.username}</div>
                <button
                  className="view-profile-button"
                    onClick={() => window.location.href = `/friend-profile/${friend.id}`}
                      >     
                        View Profile
                                </button>

              </div>
            ))
          )}
        </div>
      </div>

      {showSearchPopup && !selectedUser && (
        <div className="search-popup">
          <div className="search-popup-content">
            <h3>Search for Friends</h3>
            <input
              type="text"
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className='search' onClick={handleSearch}>Search</button>
            <button
              className="close"
              onClick={() => {
                setShowSearchPopup(false);
                setSearchResults([]);
                setNoResults(false);
              }}
            >
              Close
            </button>

            {noResults && (
              <div style={{ color: "red", marginTop: "10px" }}>
                User not found. Please try again!
              </div>
            )}

            <div className="search-results">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="friend"
                  onClick={() => {
                    setSelectedUser(user);
                    setRequestSent(false);
                  }}
                >
                  <div>{user.username}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="search-popup">
          <div className="search-popup-content">
            <h2>{selectedUser.username}</h2>
            <p>Would you like to add this user as a friend?</p>
            {!requestSent ? (
              <>
                <button onClick={handleSendFriendRequest}>Send Request</button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                  }}
                >Cancel</button>
              </>
            ) : (
              <p style={{ color: 'green' }}>Request sent!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsList;
