import React from "react";
import './friendsList.css'

const friendsData = [
  { id: 1, name: "Alex Loving" },
  { id: 2, name: "Kiersten Doecher" },
  { id: 3, name: "Grace Hanson" },
  { id: 4, name: "Lauren Taylor" },
  { id: 5, name: "Julian Hays" },
  { id: 6, name: "Carter Wright" },
  { id: 7, name: "Blake Rogers" },
  { id: 8, name: "Mark Khairullah" },
];

function FriendsList() {
  return (
    <div className="friends-page">
        <a href='/map'><button id='back'>Back to Home Page</button></a>
        <a href='/profile'><button id='profile'>Your Profile</button></a>
      <div className="friends-container">
        <h2>Friends List</h2>
        <ul id="friends-list">
          {friendsData.map((friend) => (
            <li key={friend.id} className="friend-item">
              <span>{friend.name}</span>
              <button>View Profile</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FriendsList;
