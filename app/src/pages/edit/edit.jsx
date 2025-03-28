import React from 'react';
import './edit.css';

function Edit() {
    return (
        <div className="edit">
            <img src={require ("./test profile.jpg")} alt="profile image" />
            <input type="file" id="pfp" accept="image/*" class="upload-btn"></input> 
        </div>
    );
}

export default Edit;