require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp_db'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware to verify JWT
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

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { username, email, role, password } = req.body;
  if (!username || !email || !role || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0) return res.status(400).json({ message: 'Email already registered' });

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
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
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

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  });
});

// GET CURRENT USER
app.get('/api/user/me', authenticateToken, (req, res) => {
  db.query('SELECT id, username, email FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
});

// UPDATE PROFILE
app.put('/api/user/update', authenticateToken, async (req, res) => {
  const { username, email, newPassword } = req.body;
  const updateFields = [];
  const values = [];

  if (username) { updateFields.push('username = ?'); values.push(username); }
  if (email) { updateFields.push('email = ?'); values.push(email); }
  if (newPassword) { updateFields.push('password = ?'); values.push(await bcrypt.hash(newPassword, 10)); }

  if (!updateFields.length) return res.status(400).json({ message: 'No fields to update' });

  values.push(req.user.id);
  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
  db.query(sql, values, err => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'Profile updated successfully' });
  });
});

// SAVE PENDING CERTIFICATE
app.post('/api/pending-certificates', upload.single('certificatePng'), (req, res) => {
  const {
    recipientName, issueDate, numberOfSignatories,
    signatory1Name, signatory1Role, signatory2Name, signatory2Role
  } = req.body;

  // Collect approval signatories dynamically
  const approvalSignatories = [];
  Object.keys(req.body).forEach(key => {
    if (key.startsWith('approverName')) {
      const index = key.replace('approverName', '');
      approvalSignatories.push({
        name: req.body[`approverName${index}`],
        email: req.body[`approverEmail${index}`]
      });
    }
  });

  // Validate required fields
  if (!recipientName || !issueDate || !numberOfSignatories || !signatory1Name || !signatory1Role || !req.file)
    return res.status(400).json({ message: 'All required fields must be provided' });

  const sql = `
    INSERT INTO pending_certificates
    (recipient_name, issue_date, number_of_signatories, signatory1_name, signatory1_role, signatory2_name, signatory2_role, png_path, approval_signatories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    recipientName,
    issueDate,
    numberOfSignatories,
    signatory1Name,
    signatory1Role,
    signatory2Name || null,
    signatory2Role || null,
    req.file.path,
    JSON.stringify(approvalSignatories)
  ], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to save certificate' });
    }
    res.status(201).json({ message: 'Certificate saved successfully' });
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
