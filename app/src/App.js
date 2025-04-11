/**
 * App.js
 * 
 * Main entry point of the application with persistent authentication using local storage.
 * It sets up routing for the login, register, and map pages, and manages authentication state.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Map from './pages/map/map';
import Login from './pages/Login';
import Register from './pages/Register';
import FriendsList from './pages/friendsList/friendsList';
import Profile from './pages/profile/profile';

/**
 * Main application component that manages routes and authentication state.
 * @returns {JSX.Element} The rendered application with routes.
 */
function App() {
  // Initialize authenticated state from local storage
  const [authenticated, setAuthenticated] = useState(
    () => JSON.parse(localStorage.getItem('authenticated')) || false
  );

  // Update local storage whenever `authenticated` state changes
  useEffect(() => {
    localStorage.setItem('authenticated', JSON.stringify(authenticated));
  }, [authenticated]);

  return (
    <Router>
      <Routes>
        {/* Redirect to /login if not authenticated; otherwise to /map */}
        <Route
          path="/"
          element={<Navigate to={authenticated ? "home" : "/login"} replace />}
        />

        {/* home page route */}
<Route
        path="/home"
        element={
          authenticated ? (
            <Profile />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

        {/* Login Route */}
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/map" replace />
            ) : (
              <Login setAuthenticated={setAuthenticated} />
            )
          }
        />
 {/* Friends List Page Route */}
 <Route
        path="/friends_list"
        element={
          authenticated ? (
            <FriendsList />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />


      {/* Profile Page Route */}
      <Route
        path="/profile"
        element={
          authenticated ? (
            <Profile />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
        

        {/* Register Route */}
        <Route
          path="/register"
          element={
            authenticated ? (
              <Navigate to="/map" replace />
            ) : (
              <Register />
            )
          }
        />

        {/* Map Page Route */}
        <Route
          path="/map"
          element={
            authenticated ? (
              <Map setAuthenticated={setAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
