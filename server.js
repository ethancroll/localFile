const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 8080;

// Enable CORS and security headers for external access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static files from src directory
app.use(express.static('src'));

// Get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Look for IPv4, non-internal interface
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// IP address endpoint
app.get('/api/ip', (req, res) => {
  const localIP = getLocalIPAddress();
  const clientIP = req.ip || req.connection.remoteAddress;
  res.json({ 
    ip: localIP,
    port: PORT,
    address: `${localIP}:${PORT}`,
    clientIP: clientIP
  });
});

// Test endpoint for external access
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'External access working!',
    timestamp: new Date().toISOString(),
    clientIP: req.ip || req.connection.remoteAddress
  });
});

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

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Access from other devices: http://${localIP}:${PORT}`);
  console.log(`Server bound to all interfaces (0.0.0.0:${PORT})`);
});