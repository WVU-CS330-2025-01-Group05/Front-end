/**
 * backend app.js
 *
 * Main entry point for the backend. Sets up the Express server,
 * establishes a connection to the database, and configures routes
 * and middleware for production deployment.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
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

//endpoint to serve trail data
app.get('/api/trails', (req, res) => {
  try {
    //if file moves change file path here pls
    const filePath = path.join(__dirname, 'public/data/randomTrailsSelection/trail_lines_full.geojson');
    
    //checks if the file exists or not
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Trail data file not found' });
    }
    
    //reads and parses the file and adds trail names if they don't exist
    const fileData = fs.readFileSync(filePath, 'utf8');
    const geoJson = JSON.parse(fileData);
    
    if (geoJson.features) {
      geoJson.features = geoJson.features.map((feature, idx) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        //add a default trail name if it doesn't exist
        if (!feature.properties.trailName) {
          feature.properties.trailName = `WV Trail ${idx + 1}`;
        }
        return feature;
      });
    }
    
    res.json(geoJson);
  } catch (error) {
    console.error('Error reading trail data:', error);
    res.status(500).json({ error: 'Failed to read trail data', details: error.message });
  }
});

//weather data api endpoint for the map team
app.get('/api/weather/:zip', (req, res) => {
  const zip = req.params.zip;
  
  // placehold random data until map team can call noaa api data
  const weatherData = {
    precipitation: Math.floor(Math.random() * 40),
    temperature: Math.floor(Math.random() * 30) + 50, // 50-80°F
    humidity: Math.floor(Math.random() * 50) + 40, // 40-90%
    cloudCover: Math.floor(Math.random() * 100),
    uvIndex: Math.floor(Math.random() * 10) + 1,
    pollenCount: Math.floor(Math.random() * 5) + 1, // 1-5 scale
    moonPhase: ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'][Math.floor(Math.random() * 4)]
  };
  
  res.json(weatherData);
});

// start the app listen to the server and console log messages
app.listen(BACKEND_PORT, () => {
  console.log(`✅ Server is running on port ${BACKEND_PORT}`);
  console.log(`📡 Connected to database host: ${DB_HOST}`);
  console.log(`🔒 Make sure your IP is whitelisted in Azure each session!`);
});