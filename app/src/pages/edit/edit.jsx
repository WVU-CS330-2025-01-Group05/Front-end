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
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width !== img.height) {
        alert("Image must be square.");
      } else {
        setImageFile(file);
      }
    };
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nameVar', nameVar);
    formData.append('bio', bio);
    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    try {
      await axios.post(`${API_URL}/auth/edit-profile`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Profile updated successfully!");
      navigate('/profile');
    } catch (error) {
      console.error("Error updating profile ", error);
      alert("Failed to update user profile.");
    }
  };

  return (
    <div className="edit">
      <img
        src={userData.img ? userData.img : require("./default pfp.jpg")}
        alt="profile"
      />
      <a href="/profile"><button id="back">Back to Account</button></a>

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
          <input
            type="text"
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
