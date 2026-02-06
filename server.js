const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files from src directory
app.use(express.static('src'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const upload = multer({ storage: storage });

// Upload endpoint - super simple
app.post('/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  const fileInfo = req.files.map(file => ({
    name: file.originalname,
    size: file.size,
    uploadDate: new Date().toISOString()
  }));
  
  res.json({ success: true, files: fileInfo });
});

// List files endpoint
app.get('/files', (req, res) => {
  fs.readdir('src/uploads/', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read files' });
    }
    
    const fileList = files.map(filename => {
      const filePath = path.join('src/uploads/', filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        uploadDate: stats.birthtime.toISOString()
      };
    });
    
    res.json(fileList);
  });
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('src/uploads/', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});

// Delete endpoint
app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('src/uploads/', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not delete file' });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Access from other devices: http://YOUR_LOCAL_IP:${PORT}`);
});