// // server.js

// require('dotenv').config(); // Load environment variables from .env

// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const bodyParser = require('body-parser');
// const path = require('path');
// const fs = require('fs');
// const dotenv = require('dotenv');
// const User = require('./models/User');
// const { spawn } = require('child_process');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URI, {
// }).then(() => {
//   console.log('✅ Connected to MongoDB');
// }).catch((err) => {
//   console.error('❌ MongoDB connection error:', err);
// });

// // Define user schema
// const userSchema = new mongoose.Schema({
//   uid: String,
//   name: String,
//   matricNo: String,
//   phone: String,
//   photoPath: String
// });
// const User = mongoose.model('User', userSchema);

// // Middleware
// app.set('view engine', 'ejs');
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Setup multer for file upload
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueName + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage: storage });

// // Show registration form
// app.get('/register', async (req, res) => {
//   const { uid } = req.query;

//   if (!uid) return res.status(400).send('UID not provided.');

//   // Check if user already registered
//   const user = await User.findOne({ uid });

//   if (user) {
//     res.send(`👋 Hello ${user.name}, you are already registered.`);
//   } else {
//     res.render('register', { uid });
//   }
// });

// // Handle POST registration form submission
// app.post('/register', upload.single('photo'), async (req, res) => {
//   try {
//     const { uid, name, matricNo, phone } = req.body;
//     const photoPath = req.file ? req.file.path : null;

//     if (!uid || !name || !matricNo || !phone || !photoPath) {
//       return res.status(400).send('Missing required fields.');
//     }

//     // Check if already registered
//     const existingUser = await User.findOne({ uid });
//     if (existingUser) {
//       return res.send(`⚠️ UID already registered to ${existingUser.name}`);
//     }

//     const user = new User({ uid, name, matricNo, phone, photo });
//     await user.save();

//     res.send(`✅ Registration successful for ${name}`);

//     // Face capture
//     const python = spawn('python3', ['face_capture.py', uid]);

//     python.on('close', (code) => {
//       if (code !== 0) {
//         console.error("❌ Face capture failed or no face detected.");
//         return res.redirect(`/face-retry?uid=${uid}`);
//       } else {
//         console.log("✅ Face encoding stored.");
//         res.redirect('/success');
//       }
//     });
//       app.get('/face-retry', (req, res) => {
//         const { uid } = req.query;
//         res.render('face-retry', { uid });
//       });

//       app.post('/trigger-face-capture', (req, res) => {
//         const { uid } = req.body;

//         const python = spawn('python3', ['face_capture.py', uid]);

//         python.on('close', (code) => {
//           if (code !== 0) {
//             return res.redirect(`/face-retry?uid=${uid}`);
//           }
//           res.redirect('/success');
//         });
//       });

//   } catch (err) {
//     console.error('❌ Registration error:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Home redirect (optional)
// app.get('/', (req, res) => {
//   res.send('NFC Registration Portal is live');
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server is running at http://localhost:${PORT}`);
// });

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const User = require('./models/User'); // 👈 Make sure this file exists

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the NFC registration system');
});

// Registration form
app.get('/register', (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.send("UID missing in query");
  res.render('register', { uid });
});

// Handle registration
app.post('/register', upload.single('photo'), async (req, res) => {
  const { uid, name, matric, phone } = req.body;

  try {
    const existing = await User.findOne({ uid });
    if (existing) return res.send('This card is already registered.');

    const newUser = new User({ uid, name, matric, phone });
    await newUser.save();

    // Trigger Python face capture script
    exec(`python3 face_capture.py ${uid}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Face capture error: ${stderr}`);
        return res.render('retry', { message: 'Face not detected. Please try again.', uid });
      }
      console.log(`Face capture success: ${stdout}`);
      res.redirect('/success');
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Success page
app.get('/success', (req, res) => {
  res.render('success');
});

// Retry page
app.get('/retry', (req, res) => {
  const { uid } = req.query;
  res.render('retry', { message: 'Face not detected. Please try again.', uid });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
