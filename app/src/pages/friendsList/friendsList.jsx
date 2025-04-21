import React, { useState } from "react";
import axios from "axios";
import './friendsList.css';

function FriendsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // NEW: Track selected user
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      alert("Please enter a username to search.");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/search-users`, {
        params: { query: searchQuery },
        withCredentials: true,
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching users:", error.response || error.message || error);
      alert("Failed to fetch user data. Please try again.");
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
          {/* Friends list will be here */}
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
              }}
            >
              Close
            </button>

            <div className="search-results">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="friend"
                  onClick={() => setSelectedUser(user)}
                  style={{ cursor: "pointer" }}
                >
                  <div>{user.username}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile-style view of selected user */}
      {selectedUser && (
        <div className="search-popup">
          <div className="search-popup-content">
            <h2>{selectedUser.username}</h2>
            <p>Would you like to add this user as a friend?</p>
            <button>Add Friend</button>
            <button onClick={() => setSelectedUser(null)}>Back to Search</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsList;
