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

module.exports = router;

