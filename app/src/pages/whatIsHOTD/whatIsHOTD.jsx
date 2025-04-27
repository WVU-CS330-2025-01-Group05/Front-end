import React from 'react';
import './whatIsHOTD.css';

function WhatIsHOTD() {
    return (
        <div className='whatIsHOTD'>
            <a href='/home'><button id='back'>Home</button></a>
            <div className='whatIsHOTD-container'>
                <h2>What is HotD?</h2>
                <p id='paragraph'>
                    Hike of the Day is a web application created by students at 
                    West Virginia University that was created for hikers wanting to 
                    explore West Virginia Trails. All you have to do is either select 
                    a trail on the map or in the drop down menu to see the environmental
                    statistics and ratings for that trail. Then, once you've found one 
                    you like, click the button to begin the trail and it will appear
                    on your account page (if you register). From your account page you
                    can see and rate all the hikes you've done!
                </p>
                <h2>Developers</h2>
                <h3>Back-end:</h3>
                <p id='developers'>
                    Lauren Taylor & 
                    Grace Hanson
                </p>
                <h3>Front-end:</h3>
                <p id='developers'>
                    Kiersten Doescher, 
                    Alex Loving, 
                    Julian Hays, 
                    Carter Wright, 
                    Blake Rogers, & 
                    Mark Khairullah
                </p>
            </div>
        </div>
    );
}

export default WhatIsHOTD;