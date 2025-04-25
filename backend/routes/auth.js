const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const authMiddleware = require('../environment variables/authMiddleware');
const multer = require('multer');

const router = express.Router();
const upload = multer(); // Use memory storage

// ... other routes
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

router.post('/register', async (req, res) => {
  const { username, password, bio = 'No Bio', nameVar = 'John Doe' } = req.body;

  
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

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.promise().execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
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


router.post('/edit-profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  const userId = req.user.id;
  const { bio, nameVar } = req.body;
  const imgBuffer = req.file ? req.file.buffer : null;

  try {
    let query = 'UPDATE users SET bio = ?, nameVar = ?';
    const params = [bio, nameVar];

    if (imgBuffer) {
      query += ', img = ?';
      params.push(imgBuffer);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await pool.promise().execute(query, params);
    res.status(201).json({ message: "Updated profile successfully." });
  } catch (error) {
    console.error('Error updating user data: ', error);
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.promise().execute(
      'SELECT username, numOfHikes, bio, nameVar, img FROM users WHERE id = ?',
      [req.user.id]
    );

    const user = rows[0];
    if (user) {
      if (user.img) {
        user.img = `data:image/jpeg;base64,${Buffer.from(user.img).toString('base64')}`;
      }
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Searches for users by username.
 * @route GET /auth/search-users
 * @param {string} query - The search query.
 * @returns {JSON} List of matching users.
 */
router.get('/search-users', async (req, res) => {
  const { query } = req.query;

  try {
    // Query the database for users matching the search query
    const [rows] = await pool.promise().execute(
      'SELECT id, username FROM users WHERE username LIKE ? LIMIT 10',
      [`%${query}%`]
    );

    res.json(rows); // Return the matching users
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send Friend Request
router.post('/send-request', authMiddleware, async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;
  try {
    await pool.promise().execute(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
      [senderId, receiverId]
    );
    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Get Friend Requests
router.get('/friend-requests', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.promise().execute(
      `SELECT friend_requests.id, users.username AS sender_username
       FROM friend_requests
       JOIN users ON friend_requests.sender_id = users.id
       WHERE friend_requests.receiver_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching requests' });
  }
});

// Accept Friend Request
router.post('/accept-request', authMiddleware, async (req, res) => {
  const { requestId } = req.body;
  try {
    const [[request]] = await pool.promise().execute(
      'SELECT sender_id, receiver_id FROM friend_requests WHERE id = ?',
      [requestId]
    );
    await pool.promise().execute(
      'INSERT INTO friends (user1_id, user2_id) VALUES (?, ?)',
      [request.sender_id, request.receiver_id]
    );
    await pool.promise().execute(
      'DELETE FROM friend_requests WHERE id = ?',
      [requestId]
    );
    res.status(200).json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Deny Friend Request
router.post('/deny-request', authMiddleware, async (req, res) => {
  const { requestId } = req.body;
  try {
    await pool.promise().execute(
      'DELETE FROM friend_requests WHERE id = ?',
      [requestId]
    );
    res.status(200).json({ message: 'Request denied' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deny request' });
  }
});

// Get Friends List
router.get('/friends', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.promise().execute(
      `SELECT u.id, u.username
       FROM friends f
       JOIN users u ON u.id = CASE
         WHEN f.user1_id = ? THEN f.user2_id
         WHEN f.user2_id = ? THEN f.user1_id
       END
       WHERE f.user1_id = ? OR f.user2_id = ?`,
      [userId, userId, userId, userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ error: 'Failed to fetch friends list' });
  }
});

//Post the trail the user is doing
router.post('/upload-trail', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const trailId = req.trails.id;
  const { status, rating } = req.body; 

  try {
    await pool.promise().execute(
      'INSERT INTO user_trails (user_id, trail_id, status, rating, completed_at) VALUES (?, ?, ?, ?, current_date())',
      [userId, trailId, status, rating]
    );
  }
  catch (error) {
    console.error("Error uploading trail: ", error);
    res.status(500).json({error: 'Failed to upload trail'});
  }
});

//Get trails user completed
router.get('/trails', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.promise().execute(
      'SELECT trail_id, status, rating, completed_at FROM user_trails WHERE user_id = ?',
      [req.user.id]
    );

    const user = rows[0];
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

//Fetch trail data 
router.get('/fetch-trails', authMiddleware, async (req, res) => {
  const {trailId} = req.body;
  try {
    const [rows] = await pool.promise().execute(
      'SELECT name FROM trails WHERE id = ?',
      [trailId]
    );

    const trail = rows[0];
    if (trail) {
      res.json(trail);
    } else {
      res.status(404).json({ error: 'Trail not found' });
    }
  } catch (error) {
    console.error('Error fetching trail name:', error);
    res.status(500).json({ error: 'Failed to fetch trail name' });
  }
});

module.exports = router;

