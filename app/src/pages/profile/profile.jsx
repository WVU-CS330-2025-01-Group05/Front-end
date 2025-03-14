import React from 'react';
import './profile.css';

function Profile() {
    //examples
  const name = "Lauren Taylor"; 
  const username = "LaurenKate25"; 
  const numOfHikes = 25; 
  const bio = "bio goes here"; 
  const hikeName = "Seneca Rocks";
  const date = "2/14/2025";

  return (
    <div>
      <img src={require ("./test profile.jpg")} alt="profile image" />

      <input id="back" type="button" value="Back to Main Page"/>
      <input id="edit" type="button" value="Edit Profile"/>

      <div>
        <p id="name">{name}</p>
        <p id="username">@{username}</p>
        <p id="hikes">Hikes Completed: {numOfHikes}</p>
        <label htmlFor="bio">Bio:</label>
        <p id="biography">{bio}</p>
      </div>

      <div className="completedHikes">
        <p className="completedHike">{name} completed {hikeName} on {date}!</p>
      </div>
    </div>
  );
}

export default Profile;
