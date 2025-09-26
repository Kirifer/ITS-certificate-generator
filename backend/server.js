require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();

/* CORS */
app.use(cors({
  origin: 'https://its-certificate-generator.vercel.app',
  credentials: true
}));
app.use(express.json());

/* MySQL connection */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, "ca.pem"))
  }
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

/* Cloudinary setup */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* Multer setup - use memory storage */
const upload = multer({ storage: multer.memoryStorage() });

/* Helper - upload buffer to Cloudinary */
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/* AUTH */

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, role, password } = req.body;
  if (!username || !email || !role || !password)
    return res.status(400).json({ message: 'All fields are required' });

  db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, email, role, password) VALUES (?, ?, ?, ?)',
      [username, email, role, hashedPassword],
      (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  });
});

// Login
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.image || null
      }
    });
  });
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found with this email' });

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email],
        (err) => {
          if (err) return res.status(500).json({ message: 'Error updating password' });
          res.json({ message: 'Password updated successfully' });
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// Update profile
app.put('/api/auth/update', upload.single('image'), async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'yoursecretkey');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = decoded.id;
    const { username, email, newPassword } = req.body;
    let updateFields = [];
    let values = [];

    if (username) { updateFields.push('username = ?'); values.push(username); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push('password = ?');
      values.push(hashedPassword);
    }

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, "profiles");
      updateFields.push('image = ?');
      values.push(uploaded.secure_url);
    }

    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    values.push(userId);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update profile' });
      db.query('SELECT id, username, email, role, image FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ message: 'Failed to fetch updated profile' });
        res.json({ message: 'Profile updated successfully', user: results[0] });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* CERTIFICATES */

// Save Pending Certificates
app.post('/api/pending-certificates', upload.single('certificatePng'), async (req, res) => {
  try {
    const {
      recipientName,
      issueDate,
      numberOfSignatories,
      signatory1Name,
      signatory1Role,
      signatory2Name,
      signatory2Role,
      creator_name,
      certificate_type
    } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Certificate PNG is required' });

    const uploaded = await uploadToCloudinary(req.file.buffer, "certificates");

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

    const sql = `
      INSERT INTO pending_certificates
      (recipient_name, issue_date, number_of_signatories, signatory1_name, signatory1_role,
       signatory2_name, signatory2_role, png_path, approval_signatories, creator_name, status, certificate_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `;
    const values = [
      recipientName,
      issueDate,
      numberOfSignatories,
      signatory1Name,
      signatory1Role,
      signatory2Name || null,
      signatory2Role || null,
      uploaded.secure_url,
      JSON.stringify(approvalSignatories),
      creator_name,
      certificate_type || null
    ];

    db.query(sql, values, (err) => {
      if (err) return res.status(500).json({ message: 'Failed to save certificate' });
      res.status(201).json({ message: 'Certificate saved successfully', url: uploaded.secure_url });
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get pending certificates
app.get('/api/pending-certificates', (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) return res.status(400).json({ message: 'Email is required' });

  const sql = `
    SELECT 
      id,
      recipient_name AS rname,
      issue_date,
      number_of_signatories,
      signatory1_name,
      signatory1_role,
      signatory2_name,
      signatory2_role,
      png_path,
      approval_signatories,
      creator_name,
      status,
      certificate_type
    FROM pending_certificates
    WHERE status = 'pending'
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch certificates' });

    const filtered = results.filter(cert => {
      try {
        const signatories = JSON.parse(cert.approval_signatories || '[]');
        return signatories.some(s => s.email?.toLowerCase() === userEmail.toLowerCase());
      } catch {
        return false;
      }
    });

    res.json(filtered);
  });
});

// Save pending COC
app.post('/api/pending-cert_coc', upload.single('certificatePng'), async (req, res) => {
  try {
    const {
      recipientName, numberOfHours, internsPosition, internsDepartment, pronoun, numberOfSignatories,
      signatory1Name, signatory1Role, signatory2Name, signatory2Role, creator_name
    } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Certificate PNG is required' });

    const uploaded = await uploadToCloudinary(req.file.buffer, "coc");

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

    const sql = `
      INSERT INTO pending_cert_coc
      (recipient_name, number_of_hours, interns_position, interns_department, pro_noun,
       number_of_signatories, signatory1_name, signatory1_role, signatory2_name, signatory2_role,
       png_path, approval_signatories, creator_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      recipientName,
      numberOfHours,
      internsPosition,
      internsDepartment,
      pronoun,
      numberOfSignatories,
      signatory1Name,
      signatory1Role,
      signatory2Name || null,
      signatory2Role || null,
      uploaded.secure_url,
      JSON.stringify(approvalSignatories),
      creator_name
    ], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to save certificate' });
      res.status(201).json({ message: 'Certificate saved successfully', url: uploaded.secure_url });
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Reject pending
app.post('/api/pending-certificates/:id/reject', (req, res) => {
  const certId = req.params.id;
  const sql = `UPDATE pending_certificates SET status = 'rejected' WHERE id = ?`;
  db.query(sql, [certId], err => {
    if (err) return res.status(500).json({ message: 'Rejection failed' });
    res.json({ message: 'Certificate rejected' });
  });
});

// Approve certificate
app.post('/api/approve-certificate-with-signature', upload.single('certificatePng'), async (req, res) => {
  try {
    const certId = req.body.id;
    if (!req.file || !certId) return res.status(400).json({ message: 'Missing file or certificate ID' });

    const uploaded = await uploadToCloudinary(req.file.buffer, "approved");

    db.query('SELECT * FROM pending_certificates WHERE id = ?', [certId], (err, results) => {
      if (err || results.length === 0) return res.status(500).json({ message: 'Certificate not found' });

      const cert = results[0];
      const approvalSignatories = typeof cert.approval_signatories === 'string'
        ? cert.approval_signatories
        : JSON.stringify(cert.approval_signatories || []);

      const insertSql = `
        INSERT INTO approved_certificates
        (recipient_name, creator_name, issue_date, number_of_signatories, signatory1_name, signatory1_role,
         signatory2_name, signatory2_role, png_path, approval_signatories, status, certificate_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
      `;

      db.query(insertSql, [
        cert.recipient_name,
        cert.creator_name,
        cert.issue_date,
        cert.number_of_signatories,
        cert.signatory1_name,
        cert.signatory1_role,
        cert.signatory2_name,
        cert.signatory2_role,
        uploaded.secure_url,
        approvalSignatories,
        cert.certificate_type || 'Employee of the Year'
      ], (err) => {
        if (err) return res.status(500).json({ message: 'Insert failed' });

        db.query('DELETE FROM pending_certificates WHERE id = ?', [certId], (err) => {
          if (err) return res.status(500).json({ message: 'Cleanup failed' });
          res.json({ message: 'Certificate approved and moved to approved_certificates', url: uploaded.secure_url });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed' });
  }
});

// DELETE approved certificate by ID
app.delete('/api/approved-certificates/:id', (req, res) => {
  const certId = req.params.id;

  const selectSql = 'SELECT png_path FROM approved_certificates WHERE id = ?';
  db.query(selectSql, [certId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'Certificate not found' });

    const deleteSql = 'DELETE FROM approved_certificates WHERE id = ?';
    db.query(deleteSql, [certId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to delete certificate from DB' });
      res.status(200).json({ message: 'Certificate deleted successfully' });
    });
  });
});

// Get approved certificates
app.get('/api/approved-certificates', (req, res) => {
  const sql = `
    SELECT 
      id,
      recipient_name AS rname,
      signatory1_name,
      issue_date,
      png_path,
      creator_name,
      status,
      certificate_type
    FROM approved_certificates
    WHERE status = 'approved'
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch approved certificates' });
    res.json(results);
  });
});

/* START SERVER */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
