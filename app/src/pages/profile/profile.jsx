import React from 'react';
import './profile.css';

function Profile() {
    //examples
  const name = "Lauren Taylor"; 
  const username = "LaurenKate25"; 
  const numOfHikes = 25; 
  const bio = "bio goes here"; 

  return (
    <div className='profile'>
      <img src="test profile.jpg" alt="profile image" />

      <a href='/'><button id='back'>Back to Home Page</button></a>
      <a href='/'><button id='edit'>Edit Profile</button></a>

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
