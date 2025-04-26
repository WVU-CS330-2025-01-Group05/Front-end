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

//checks if the trail name exists in the database. If it doesnt it will be added to the database
router.post('/upload-trail', authMiddleware, async (req, res) => {
  //check if the user is authenticated
  const userId = req.user.id;
  const { trailName, status, rating } = req.body;

//if the trail name is not provided return an error
  if (!trailName) {
    return res.status(400).json({ error: 'Trail name is required' });
  }

  try {
    // Check if user already has an in-progress trail
    const [existingInProgress] = await pool.promise().execute(
      'SELECT id FROM user_trails WHERE user_id = ? AND status = ?',
      [userId, 'in-progress']
    );

    if (existingInProgress.length > 0) {
      return res.status(400).json({ error: 'You already have an active trail in progress. Complete or void it first.' });
    }

    //proceed as normal if no active trail exists
    const [existingTrail] = await pool.promise().execute(
      'SELECT id FROM trails WHERE name = ?',
      [trailName]
    );
// Check if the trail name already exists in the database
    let trailId;
    if (existingTrail.length > 0) {
      trailId = existingTrail[0].id;
    } else {
      const [result] = await pool.promise().execute(
        'INSERT INTO trails (name) VALUES (?)',
        [trailName]
      );
      trailId = result.insertId;
    }
//insert the trail into user_trails with status 'in-progress'
    await pool.promise().execute(
      'INSERT INTO user_trails (user_id, trail_id, status, rating, completed_at) VALUES (?, ?, ?, ?, NULL)',
      [userId, trailId, status ?? 'in-progress', rating ?? null]
    );
    res.status(201).json({ message: 'Trail uploaded successfully' });

  } catch (error) {
    console.error("Error uploading trail: ", error);
    res.status(500).json({ error: 'Failed to upload trail' });
  }
});


//post to get the users last completed trail
router.post('/trails', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.promise().execute(
      `SELECT trail_id, status, rating, completed_at 
       FROM user_trails 
       WHERE user_id = ? 
       ORDER BY 
         CASE status 
           WHEN 'in-progress' THEN 1
           WHEN 'completed' THEN 2
           ELSE 3 END, 
         completed_at DESC 
       LIMIT 1`,
      [req.user.id]
    );

    const trail = rows[0];
    if (trail) {
      res.json(trail);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching trail data:', error);
    res.status(500).json({ error: 'Failed to fetch trail data' });
  }
});



// Post to get the trail name from trail id
router.post('/fetch-trails', authMiddleware, async (req, res) => {
  const { trailId } = req.body;

  if (!trailId) {
    return res.status(400).json({ error: "Trail ID is required" });
  }

  try {
    const [rows] = await pool.promise().execute(
      'SELECT id, name, total_rating, rating_count FROM trails WHERE id = ?',
      [trailId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Trail not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching trail:', error);
    res.status(500).json({ error: 'Failed to fetch trail' });
  }
});



//post to get the users last completed trail
//this will be used to get the last completed trail and show it in the profile page
router.post('/complete-trail', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if the user has an in-progress trail
    const [current] = await pool.promise().execute(
      'SELECT id FROM user_trails WHERE user_id = ? AND status = ? ORDER BY completed_at DESC LIMIT 1',
      [userId, 'in-progress']
    );

    // If no in-progress trail is found return an error

    if (current.length === 0) {
      return res.status(400).json({ error: 'No active trail to complete' });
    }

    const trailEntryId = current[0].id;
//update the trail entry to mark it as completed
    await pool.promise().execute(
      'UPDATE user_trails SET status = ?, completed_at = current_date() WHERE id = ?',
      ['completed', trailEntryId]
    );

    await pool.promise().execute(
      'UPDATE users SET numOfHikes = numOfHikes + 1 WHERE id = ?',
      [userId]
    );

    res.status(200).json({ message: 'Trail marked as completed' });
  } catch (error) {
    console.error('Error completing trail:', error);
    res.status(500).json({ error: 'Failed to complete trail' });
  }
});
//post to void current trail if they want
router.post('/void-trail', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    //check if the user has an in-progress trail
    const [current] = await pool.promise().execute(
      'SELECT id FROM user_trails WHERE user_id = ? AND status = ? ORDER BY completed_at DESC LIMIT 1',
      [userId, 'in-progress']
    );

    // If no in-progress trail is found return an error
    if (current.length === 0) {
      return res.status(400).json({ error: 'No active trail to void' });
    }

    const trailEntryId = current[0].id;
//update the trail entry to mark it as voided
    await pool.promise().execute(
      'DELETE FROM user_trails WHERE id = ?',
      [trailEntryId]
    );

    res.status(200).json({ message: 'Trail voided successfully' });
  } catch (error) {
    console.error('Error voiding trail:', error);
    res.status(500).json({ error: 'Failed to void trail' });
  }
});

router.get('/completed-hikes', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [completed] = await pool.promise().execute(
      `SELECT trails.name, user_trails.completed_at
       FROM user_trails
       JOIN trails ON user_trails.trail_id = trails.id
       WHERE user_trails.user_id = ? AND user_trails.status = ?
       ORDER BY user_trails.completed_at DESC`,
      [userId, 'completed']
    );

    res.json(completed);
  } catch (error) {
    console.error('Error fetching completed hikes:', error);
    res.status(500).json({ error: 'Failed to fetch completed hikes' });
  }
});
//rate trail work in progress cause it doesnt work yet
router.post('/rate-trail', authMiddleware, async (req, res) => {
  const { trailId, rating } = req.body;

  if (!trailId || rating < 0 || rating > 5) {
    return res.status(400).json({ error: "Invalid trail or rating" });
  }

  try {
    await pool.promise().execute(
      'UPDATE trails SET total_rating = total_rating + ?, rating_count = rating_count + 1 WHERE id = ?',
      [rating, trailId]
    );

    res.json({ message: 'Rating saved successfully' });
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

router.get('/profile/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.promise().execute(
      'SELECT username, numOfHikes, bio, nameVar, img FROM users WHERE id = ?',
      [id]
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
    console.error('Error fetching friend profile:', error);
    res.status(500).json({ error: 'Failed to fetch friend profile' });
  }
});

// Get Sent Friend Requests
router.get('/sent-requests', authMiddleware, async (req, res) => {
  const senderId = req.user.id;
  try {
    const [rows] = await pool.promise().execute(
      `SELECT friend_requests.id, users.username AS receiver_username
       FROM friend_requests
       JOIN users ON friend_requests.receiver_id = users.id
       WHERE friend_requests.sender_id = ?`,
      [senderId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching sent requests:', err);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});




module.exports = router;

