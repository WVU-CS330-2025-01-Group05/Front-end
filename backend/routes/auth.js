const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database'); // Using our MySQL pool
const authMiddleware = require('../environment variables/authMiddleware'); // Import authMiddleware
const router = express.Router();

/**
 * Registers a new user by hashing the password and storing user data in the database.
 * @route POST /auth/register
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user (will be hashed before storing).
 * @returns {JSON} Success message or error message.
 */
router.post('/register', async (req, res) => {
  const { username, password, bio, nameVar } = req.body;

  try {
    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [result] = await pool.promise().execute(
      'INSERT INTO users (username, password, bio, nameVar) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, bio, nameVar]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * Authenticates a user by verifying the password and generates a JWT for session management.
 * @route POST /auth/login
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user (plain text).
 * @returns {JSON} Success message with JWT cookie or error message.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the database for the user by username
    const [rows] = await pool.promise().execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];

    // If user exists and the password matches, generate a JWT
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Set JWT in an HTTP-only cookie
      res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * Fetches the logged-in user's profile.
 * @route GET /auth/profile
 * @returns {JSON} User's profile data or error message.
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Query the database for the user's data using their ID
    const [rows] = await pool.promise().execute(
      'SELECT username, numOfHikes, bio, nameVar FROM users WHERE id = ?',
      [req.user.id] // `req.user.id` is set by the authMiddleware
    );

    const user = rows[0];
    if (user) {
      res.json(user); // Return the user's data
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Logs out the user by clearing the authentication cookie.
 * @route POST /auth/logout
 * @returns {JSON} Success message.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the authentication cookie
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;