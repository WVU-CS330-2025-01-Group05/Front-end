import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import reportWebVitals from './reportWebVitals';


import Home from "./pages/home/home"
import Map from "./pages/map/map"
import App from './App';

import Profile from "./pages/profile/profile"
import Login from './pages/Login';

// import Signup from './pages/signup/signup'
import Register from './pages/Register'
import FriendsList from './pages/friendsList/friendsList'
import Edit from './pages/edit/edit';




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
