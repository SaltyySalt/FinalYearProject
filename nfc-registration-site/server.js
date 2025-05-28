// // server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Configure Multer for photo upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Route to show registration form with UID
app.get('/register', (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send('Missing UID in query.');
  res.render('register', { uid });
});

// Handle form submission
app.post('/register', upload.single('photo'), async (req, res) => {
  const { name, matric, phone, uid } = req.body;
  const photo = req.file ? req.file.path : null;

  try {
    const existing = await User.findOne({ uid });
    if (existing) return res.send('User already registered.');

    const newUser = new User({ uid, name, matric, phone, photo });
    await newUser.save();
    res.render('success', { name });
  } catch (error) {
    res.status(500).send('Registration failed.');
  }
});

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to NFC Registration Portal');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
