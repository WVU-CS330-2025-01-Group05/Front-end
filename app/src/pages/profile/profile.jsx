import React from 'react';
import './profile.css';

function Profile() {
    //examples
  const name = "Lauren Taylor"; 
  const username = "LaurenKate25"; 
  const numOfHikes = 25; 
  const bio = "bio goes here"; 

  return (
    <div>
      <img src="test profile.jpg" alt="profile image" />

      <input id="back" type="button" value="Back to Home Page" />
      <input id="edit" type="button" value="Edit Profile" />

      <div>
        <p id="name">{name}</p>
        <p id="username">{username}</p>
        <p id="hikes">Hikes Completed: {numOfHikes}</p>
        <label htmlFor="bio">Bio:</label>
        <p id="biography">{bio}</p>
      </div>
    </div>
  );
}

export default Profile;
