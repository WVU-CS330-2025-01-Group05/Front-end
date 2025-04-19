import React, { useState } from "react";
import axios from "axios";
import './friendsList.css';

function FriendsList() {
  const [searchQuery, setSearchQuery] = useState(""); // State for search input
  const [searchResults, setSearchResults] = useState([]); // State for search results
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State to toggle search popup
  const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Backend API URL

  // Handle search button click
  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      alert("Please enter a username to search.");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/search-users`, {
        params: { query: searchQuery }, // Send search query to backend
        withCredentials: true,
      });
      setSearchResults(response.data); // Update search results
    } catch (error) {
      console.error("Error searching users:", error);
      alert("Failed to fetch user data. Please try again.");
    }
  };

  return (
    <div className="friends-page">
      <div className="container">
        {/* Add Friend button */}
        <button
          className="add-friend-button"
          onClick={() => setShowSearchPopup(true)}
        >
          Add Friend
        </button>

        {/* Friends list */}
        <div className="friendsHeader">
          <span>Friends</span>
        </div>
        <div className="friends">
          {/* Friends list will remain blank for now */}
        </div>
      </div>

      {/* Search popup */}
      {showSearchPopup && (
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
                setSearchResults([]); // Clear search results when closing
              }}
            >
              Close
            </button>
          </div>

          {/* Search results */}
          <div className="search-results">
            {searchResults.map((user) => (
              <div key={user.id} className="friend">
                <div>{user.username}</div>
                <button>Add Friend</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsList;