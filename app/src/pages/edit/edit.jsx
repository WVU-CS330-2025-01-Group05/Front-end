import React from 'react';
import './edit.css';

function Edit() {
    return (
        <div className="edit">
            <img src={require ("./default pfp.jpg")} alt="profile image" />

            <a href="/profile"><button id="back">Back to Account</button></a>

            <div className="pfp">
                <label for="pfp">Edit Profile Picture (upload SQUARE PNG, JPEG, or JPG)</label>
                <input type="file" id="pfp" accept="image/png, image/jpeg, image/jpg" ></input>
            </div>

        </div>
    );
}

export default Edit;