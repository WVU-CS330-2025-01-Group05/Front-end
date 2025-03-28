import React from 'react';
import './profile.css';

function Profile() {
    //examples
  const name = "Lauren Taylor"; 
  const username = "LaurenKate25"; 
  const numOfHikes = 25; 
  const bio = "bio goes here"; 
  const hikeName = "Seneca Rocks";
  const day = "2/14/2025";

  return (
    <div className='profile'>
      <img src={require ("./test profile.jpg")} alt="profile image" />

      <a href='/map'><button id='back'>Back to Home Page</button></a>
      <a href='/friends_list'><button id='friendsList'>Friends List</button></a>
      <a href='/edit'><button id='editProfile'>Edit Profile</button></a>

      <div>
        <p id="name">{name}</p>
        <p id="username">@{username}</p>
        <p id="hikes">Hikes Completed: {numOfHikes}</p>
        <label htmlFor="bio">Bio:</label>
        <p id="biography">{bio}</p>
      </div>

      <div className="hikes">
        <p className="completedHike">{name} completed {hikeName} on {day}!</p>
      </div>
    </div>
  );
}

export default Profile;
