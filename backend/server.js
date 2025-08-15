require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp_db'
});

db.connect(err => {
  if (err) {
    console.error(' Database connection failed:', err);
    process.exit(1);
  }
  console.log(' Connected to MySQL');
});

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register route
app.post('/api/auth/register', async (req, res) => {
  const { username, email, role, password } = req.body;
  if (!username || !email || !role || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO users (username, email, role, password) VALUES (?, ?, ?, ?)',
        [username, email, role, hashedPassword],
        (err) => {
          if (err) return res.status(500).json({ message: 'Database error' });
          return res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  } catch (error) {
    console.error(' Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'yoursecretkey',
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

// Get current user profile
app.get('/api/user/me', authenticateToken, (req, res) => {
  db.query('SELECT id, username, email FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
});

// Update user profile
app.put('/api/user/update', authenticateToken, async (req, res) => {
  const { username, email, newPassword } = req.body;
  let updateFields = [];
  let values = [];

  if (username) {
    updateFields.push('username = ?');
    values.push(username);
  }
  if (email) {
    updateFields.push('email = ?');
    values.push(email);
  }
  if (newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    updateFields.push('password = ?');
    values.push(hashed);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  values.push(req.user.id);
  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Profile updated successfully' });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
