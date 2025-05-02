import React, { useState, useEffect } from 'react';
import './edit.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Edit() {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_BACKEND_API_URL;
  const [nameVar, setNameVar] = useState('');
  const [bio, setBio] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [userData, setUserData] = useState({ img: null });

  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  
  const triggerAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  
    setTimeout(() => {
      setShowAlert(false);
    }, 2500);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [API_URL]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width !== img.height) {
        triggerAlert("🖼️ Image must be square.");
      } else {
        setImageFile(file);
      }
    };
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    //checks if user wants to change their information or not
    if (nameVar.length === 0) {
      formData.append('nameVar', userData.nameVar);
    }
    else {
      formData.append('nameVar', nameVar);
    }
    if (bio.length === 0) {
      formData.append('bio', userData.bio);
    }
    else {
      formData.append('bio', bio);
    }
    
    //uploads image to database if uploaded
    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    try {
      await axios.post(`${API_URL}/auth/edit-profile`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      triggerAlert("✔️ Profile updated successfully!");
      navigate('/profile');
    } catch (error) {
      console.error("Error updating profile ", error);
      if (bio.length > 255) {
        triggerAlert("✖️ Bio is too long.")
      }
      else if (nameVar.length > 55) {
        triggerAlert("✖️ Name is too long.")
      }
    }
  };

  return (
    <div className="edit">
      {showAlert && (
        <div className="custom-alert">
          {alertMessage}
        </div>
      )}
      <img
        src={userData.img ? userData.img : require("./default pfp.jpg")}
        alt="profile"
      />
      <a href="/profile"><button id="back">Account</button></a>

      <div className="edit-container">
        <form onSubmit={handleEdit}>
          <div className="pfp">
            <label htmlFor="file">Edit Profile Picture (SQUARE only)</label>
            <input type="file" id="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
          </div>

          <input
            type="text"
            placeholder="Name"
            value={nameVar}
            onChange={(e) => setNameVar(e.target.value)}
          />
          <textarea
            rows="4"
            cols="50"
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <input type="submit" id="submit" />
        </form>
      </div>
    </div>
  );
}

export default Edit;
