/**
 * index.js
 *
 * Main entry point for the backend. Sets up the Express server,
 * establishes a connection to the database, and configures routes
 * and middleware for production deployment.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import cors
const authRoutes = require('./routes/auth'); // Authentication routes

const app = express();
const BACKEND_PORT = process.env.BACKEND_PORT;
const DB_HOST = process.env.DB_HOST;

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
app.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
});

//print to terminal when connected to the database. confirmation for Azure connection
app.listen(DB_HOST, () => {
console.log(`Connected to database at ${DB_HOST}. \n Make sure your IP is connected to Azure each session!`);
});
app.get('/api/trails', (req, res) => {
  res.sendFile(path.join(__dirname, 'path/to/trail_lines_full.geojson'));
});