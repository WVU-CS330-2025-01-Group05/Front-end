import React, { useState } from "react";
import axios from "axios";
import './friendsList.css';

function FriendsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [noResults, setNoResults] = useState(false); // NEW: track no results
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      alert("Please enter a username to search.");
      return;
    }

    try {
      setNoResults(false); // Reset on new search
      const response = await axios.get(`${API_URL}/auth/search-users`, {
        params: { query: searchQuery },
        withCredentials: true,
      });

      setSearchResults(response.data);
      setNoResults(response.data.length === 0); // Show message if no users
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
          {/* Friends list will go here */}
        </div>
      </div>

      {/* Search popup */}
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
                setNoResults(false); // Clear error
              }}
            >
              Close
            </button>

            {/* No results message */}
            {noResults && (
              <div style={{ color: "red", marginTop: "10px" }}>
                User not found. Please try again!
              </div>
            )}

            {/* Search results */}
            <div className="search-results">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="friend"
                  onClick={() => setSelectedUser(user)}
                >
                  <div>{user.username}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected user profile popup */}
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
