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
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => res.set('Access-Control-Allow-Origin', '*')
}));

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

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

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
      user: { id: user.id, username: user.username, email: user.email, role: user.role, image: user.image ? user.image : null}
    });
  });
});

// Update Profile
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

    if (username) {
      updateFields.push('username = ?');
      values.push(username);
    }

    if (email) {
      updateFields.push('email = ?');
      values.push(email);
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.push('password = ?');
      values.push(hashedPassword);
    }

    if (req.file) {
      const imagePath = path.join('uploads', req.file.filename).replace(/\\/g, '/');
      updateFields.push('image = ?');
      values.push(imagePath);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userId);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err) => {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ message: 'Failed to update profile' });
      }

      db.query(
        'SELECT id, username, email, role, image FROM users WHERE id = ?',
        [userId],
        (err, results) => {
          if (err || results.length === 0) {
            return res.status(500).json({ message: 'Failed to fetch updated profile' });
          }

          const updatedUser = results[0];
          res.json({
            message: 'Profile updated successfully',
            user: updatedUser
          });
        }
      );
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/* CERTIFICATES */

// Save pending certificate (generic with certificate_type)
app.post('/api/pending-certificates', upload.single('certificatePng'), (req, res) => {
  const {
    recipientName, issueDate, numberOfSignatories,
    signatory1Name, signatory1Role, signatory2Name, signatory2Role,
    creator_name, certificate_type
  } = req.body;

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

  if (!recipientName || !issueDate || !numberOfSignatories || !signatory1Name || !signatory1Role || !creator_name || !req.file)
    return res.status(400).json({ message: 'All required fields must be provided' });

  const sql = `
    INSERT INTO pending_certificates
    (recipient_name, issue_date, number_of_signatories, signatory1_name, signatory1_role,
     signatory2_name, signatory2_role, png_path, approval_signatories, creator_name, status, certificate_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `;

  db.query(sql, [
    recipientName,
    issueDate,
    numberOfSignatories,
    signatory1Name,
    signatory1Role,
    signatory2Name || null,
    signatory2Role || null,
    path.join('uploads', req.file.filename).replace(/\\/g, '/'),
    JSON.stringify(approvalSignatories),
    creator_name,
    certificate_type || null
  ], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to save certificate' });
    }
    res.status(201).json({ message: 'Certificate saved successfully' });
  });
});

// Get pending
app.get('/api/pending-certificates', (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

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
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch certificates' });
    }

    // Filter by approval_signatories JSON
    const filtered = results.filter(cert => {
      try {
        const signatories = JSON.parse(cert.approval_signatories || '[]');
        return signatories.some(s => s.email?.toLowerCase() === userEmail.toLowerCase());
      } catch (e) {
        return false;
      }
    });

    res.json(filtered);
  });
});

// Save pending COC
app.post('/api/pending-cert_coc', upload.single('certificatePng'), (req, res) => {
  const {
    recipientName, numberOfHours, internsPosition, internsDepartment, pronoun, numberOfSignatories,
    signatory1Name, signatory1Role, signatory2Name, signatory2Role,
    creator_name
  } = req.body;

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

  if (!recipientName || !numberOfHours || !internsPosition || !internsDepartment || !pronoun || !numberOfSignatories || !signatory1Name || !signatory1Role || !creator_name || !req.file)
    return res.status(400).json({ message: 'All required fields must be provided' });

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
    path.join('uploads', req.file.filename).replace(/\\/g, '/'),
    JSON.stringify(approvalSignatories),
    creator_name
  ], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to save certificate' });
    }
    res.status(201).json({ message: 'Certificate saved successfully' });
  });
});

// Reject pending
app.post('/api/pending-certificates/:id/reject', (req, res) => {
  const certId = req.params.id;
  const sql = `UPDATE pending_certificates SET status = 'rejected' WHERE id = ?`;
  db.query(sql, [certId], err => {
    if (err) {
      console.error('Rejection error:', err);
      return res.status(500).json({ message: 'Rejection failed' });
    }
    res.json({ message: 'Certificate rejected' });
  });
});

// Approve certificate
app.post('/api/approve-certificate-with-signature', upload.single('certificatePng'), (req, res) => {
  const certId = req.body.id;
  if (!req.file || !certId) {
    return res.status(400).json({ message: 'Missing file or certificate ID' });
  }

  const newPath = path.join('uploads', req.file.filename).replace(/\\/g, '/');

  db.query('SELECT * FROM pending_certificates WHERE id = ?', [certId], (err, results) => {
    if (err || results.length === 0) {
      console.error('Certificate not found:', err);
      return res.status(500).json({ message: 'Certificate not found' });
    }

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
      newPath,
      approvalSignatories,
      cert.certificate_type || 'Employee of the Year'
    ], (err, result) => {
      if (err) {
        console.error('Insert failed:', err);
        return res.status(500).json({ message: 'Insert failed' });
      }

      db.query('DELETE FROM pending_certificates WHERE id = ?', [certId], (err) => {
        if (err) return res.status(500).json({ message: 'Cleanup failed' });
        res.json({ message: 'Certificate approved and moved to approved_certificates' });
      });
    });
  });
});

// DELETE approved certificate by ID
app.delete('/api/approved-certificates/:id', (req, res) => {
  const certId = req.params.id;

  const selectSql = 'SELECT png_path FROM approved_certificates WHERE id = ?';
  db.query(selectSql, [certId], (err, results) => {
    if (err) {
      console.error('Select failed:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const imagePath = path.join(__dirname, results[0].png_path);

    const deleteSql = 'DELETE FROM approved_certificates WHERE id = ?';
    db.query(deleteSql, [certId], (err) => {
      if (err) {
        console.error('Delete failed:', err);
        return res.status(500).json({ message: 'Failed to delete certificate from DB' });
      }

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.warn('Image file not deleted or missing:', err.message);
        }
        return res.status(200).json({ message: 'Certificate deleted successfully' });
      });
    });
  });
});

// Get approved
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
    if (err) {
      console.error('Database fetch failed:', err);
      return res.status(500).json({ message: 'Failed to fetch approved certificates' });
    }
    res.json(results);
  });
});

/* START SERVER */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
