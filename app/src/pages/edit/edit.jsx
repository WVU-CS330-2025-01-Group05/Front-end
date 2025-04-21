import React, { useState } from 'react';
import './edit.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Edit() {
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_BACKEND_API_URL; //Backend API URL
    const [nameVar, setNameVar] = useState('');
    const [bio, setBio] = useState('');
    //const [updateProfile, setUpdateProfile] = useState(false);

    const handleEdit = async (e) => {
        e.preventDefault();
        
        try {
            await axios.post(
                API_URL + '/auth/edit-profile',
                { bio, nameVar },
                { withCredentials: true }
            );
            //setUpdateProfile(true);
            alert("Profile updated successfully!");
            navigate('/profile');
        } catch (error) {
            console.error("Error updating profile ", error);
            alert("Failed to update user profile.");
        }
    }

    return (
        <div className="edit">
            <img src={require ("./default pfp.jpg")} alt="profile image" />
            <a href="/profile"><button id="back">Back to Account</button></a>

            <div className="edit-container">
            <form onSubmit={handleEdit}>
                <div className="pfp">
                    <label for="pfp">Edit Profile Picture (upload SQUARE PNG, JPEG, or JPG)</label>
                    <input type="file" id="file" accept="image/png, image/jpeg, image/jpg" ></input>
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

                <input type="submit" id="submit"></input>
            </form>
            </div>
        </div>
    );
}

export default Edit;