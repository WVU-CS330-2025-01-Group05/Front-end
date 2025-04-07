/**
 * index.js
 *
 * Main entry point for the backend. Sets up the Express server,
 * establishes a connection to the database, and configures routes
 * and middleware for production deployment.
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import cors
const authRoutes = require('./routes/auth'); // Authentication routes

const app = express();
const PORT = process.env.API_PORT;

// Middleware setup
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Parse cookies attached to client requests

// Enable CORS and allow credentials
app.use(cors({
  origin: process.env.FRONTEND_URL, // Adjust this if your frontend runs on a different URL
  credentials: true
}));

// Route setup
app.use('/auth', authRoutes); // Authentication-related routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});