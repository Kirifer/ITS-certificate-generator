require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt'); // kept for possible future use
const jwt = require('jsonwebtoken'); // kept for token usage
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

/* =========================
   Middleware
========================= */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // allow base64 images in JSON
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   Database Connection (Pool)
========================= */
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL Database');
  connection.release();
});

/* =========================
   JWT Middleware (kept)
========================= */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

/* =========================
   Multer storage for PNG (kept for file uploads)
========================= */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png';
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'image/png') {
      return cb(new Error('Only PNG files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/* =========================
   PENDING CERTIFICATES ROUTE (base64 support)
========================= */
app.post('/api/pending-certificates', (req, res) => {
  try {
    console.log('---- /api/pending-certificates START ----');
    console.log('Body:', req.body);

    const {
      recipientName,
      issueDate,
      numberOfSignatories,
      signatory1Name,
      signatory1Role,
      signatory2Name,
      signatory2Role,
      image // base64 PNG from preview
    } = req.body;

    if (!recipientName || !issueDate || !numberOfSignatories || !signatory1Name || !signatory1Role || !image) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Save base64 PNG to file
    const fileName = Date.now() + '-' + Math.round(Math.random() * 1e9) + '.png';
    const filePath = path.join(uploadsDir, fileName);

    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');

    const sql = `
      INSERT INTO pending_certificates 
      (recipient_name, issue_date, number_of_signatories, signatory1_name, signatory1_role, signatory2_name, signatory2_role, png_path, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const values = [
      recipientName,
      issueDate,
      parseInt(numberOfSignatories, 10),
      signatory1Name,
      signatory1Role,
      signatory2Name || null,
      signatory2Role || null,
      path.join('uploads', fileName)
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting pending certificate:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      console.log('Insert OK. ID:', result.insertId);
      console.log('---- /api/pending-certificates END ----');
      res.json({ message: 'Pending certificate saved successfully', id: result.insertId });
    });
  } catch (e) {
    console.error('Unhandled error in /api/pending-certificates:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
});

/* =========================
   Global Error Handler
========================= */
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Upload error', details: err.message });
  }
  return res.status(500).json({ error: 'Server error', details: err.message });
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
