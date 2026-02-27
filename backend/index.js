const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const encryptedName = crypto.randomBytes(8).toString('hex') + path.extname(file.originalname);
    cb(null, encryptedName);
  }
});

const upload = multer({ storage });

let fileStore = {}; // In-memory store: code => { filename, originalName }

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const code = crypto.randomBytes(4).toString('hex');
  fileStore[code] = {
    filename: file.filename,
    originalName: file.originalname
  };

  res.json({ code });
});

app.get('/download/:code', (req, res) => {
  const code = req.params.code;
  const fileData = fileStore[code];

  if (fileData && fileData.filename) {
    const filename = fileData.filename;
    const originalName = fileData.originalName;
    const filepath = path.join(__dirname, 'uploads', filename);
    res.download(filepath, originalName, (err) => {
      if (!err) {
        // Delete file after download
        fs.unlinkSync(filepath);
        delete fileStore[code];
      }
    });
  } else {
    res.status(404).json({ message: 'Invalid code' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
