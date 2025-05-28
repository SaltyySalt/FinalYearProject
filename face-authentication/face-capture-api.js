const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.post('/trigger-face-capture', (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ message: 'UID is required.' });
  }

  // Run the Python facial capture script with UID as an argument
  exec(`python3 face_capture.py ${uid}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Face capture error: ${error.message}`);
      return res.status(500).json({ message: 'Face capture failed.', error: error.message });
    }
    if (stderr) {
      console.error(`Face capture stderr: ${stderr}`);
    }
    console.log(`Face capture stdout: ${stdout}`);
    return res.status(200).json({ message: 'Face capture triggered successfully.', output: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`🎯 Face Capture API running on http://localhost:${PORT}`);
});
