import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import reportWebVitals from './reportWebVitals';

import Home from "./pages/home/home"
import Map from "./pages/map/map"
import Friends from "./pages/friends/friends"
import Profile from "./pages/profile/profile"
import Login from './pages/login/login'
import Signup from './pages/signup/signup'




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/signup" element={<Signup />}/>
        <Route path='/map' element={<Map />}/>
        <Route path='/friends' element={<Friends />} />
        <Route path='/profile' element={<Profile />} />
      </Routes>
    </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
