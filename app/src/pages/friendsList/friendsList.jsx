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

    // Listen for the custom event to refresh the list
    window.addEventListener("friendsUpdated", fetchFriends);
    return () => window.removeEventListener("friendsUpdated", fetchFriends);
  }, [API_URL]);

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      alert("Please enter a username to search.");
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
      alert("Failed to fetch user data. Please try again.");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await axios.post(`${API_URL}/auth/send-request`, {
        receiverId: selectedUser.id,
      }, { withCredentials: true });
      setRequestSent(true);
    } catch (err) {
      console.error("Error sending request:", err);
      alert("Failed to send friend request.");
    }
  };

  return (
    <div className="friends-page">
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
                <button className="view-profile-button">View Profile</button>
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
            <button onClick={handleSearch}>SEARCH</button>
            <button
              className="close-popup-button"
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
            <button onClick={handleSendFriendRequest}>Add Friend</button>
            <button onClick={() => setSelectedUser(null)}>Back to Search</button>

            {requestSent && (
              <p style={{ color: "green", marginTop: "10px" }}>
                Friend request sent!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsList;
