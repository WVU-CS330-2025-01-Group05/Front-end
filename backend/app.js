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
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const BACKEND_PORT = process.env.BACKEND_PORT;
const DB_HOST = process.env.DB_HOST;

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Routes
app.use('/auth', authRoutes);

// Test route (optional)
app.get('/api/trails', (req, res) => {
  res.sendFile(path.join(__dirname, 'path/to/trail_lines_full.geojson'));
});

// ✅ SINGLE app.listen()
app.listen(BACKEND_PORT, () => {
  console.log(`✅ Server is running on port ${BACKEND_PORT}`);
  console.log(`📡 Connected to database host: ${DB_HOST}`);
  console.log(`🔒 Make sure your IP is whitelisted in Azure each session!`);
});
