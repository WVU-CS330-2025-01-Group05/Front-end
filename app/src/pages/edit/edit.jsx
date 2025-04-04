import React from 'react';
import './edit.css';

function Edit() {
    return (
        <div className="edit">
            <img src={require ("./default pfp.jpg")} alt="profile image" />

            <a href="/profile"><button id="back">Back to Profile</button></a>

            <form>
                <div className="pfp">
                    <label for="pfp">Edit Profile Picture (upload SQUARE PNG, JPEG, or JPG)</label>
                    <input type="file" id="file" accept="image/png, image/jpeg, image/jpg" ></input>
                </div>

                <div className="inputs">
                    <label for="name">Enter Name: <br></br></label>
                    <input type="text" id="name" size="53"></input><br></br><br></br>
                    <label for="username">Enter New Username: <br></br></label>
                    <input type="text" id="username" size="53"></input>
                    <p>USERNAME IS ALREADY TAKEN</p>
                    <label for="bio">Enter Bio: <br></br></label>
                    <textarea id="bio" name="bio" rows="5" cols="50"></textarea>
                </div>

                <input type="submit" id="submit"></input>
            </form>
        </div>
    );
}

export default Edit;