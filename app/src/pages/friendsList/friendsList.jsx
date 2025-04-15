import React from "react";
import './friendsList.css'


const friendsData = [
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 1, name: "Alex Loving" },
  { id: 2, name: "Kiersten Doecher" },
  { id: 3, name: "Grace Hanson" },
  { id: 4, name: "Lauren Taylor" },
  { id: 5, name: "Julian Hays" },
  { id: 6, name: "Carter Wright" },
  { id: 7, name: "Blake Rogers" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
  { id: 8, name: "Mark Khairullah" },
];


function FriendsList() {
  return (




    <div className="friends-page">
      <div className='container'>
        <div className='friendsHeader'>
          <span>Friends</span>
        </div>
        <div className='friends'>
          {friendsData.map((friend) => (
            <div key={friend.id} className='friend'>
              <div>{friend.name}</div>
              <button>View Profile</button>
            </div>
          ))}
        </div>
      </div>
    </div>


  );
}


export default FriendsList;