// API route to serve the CORRECT Apple Pay file and override cached version
// This reads from the built dist/spa/.well-known/ directory
const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  // Try multiple possible paths where the file might be
  const possiblePaths = [
    path.join(__dirname, '../../dist/spa/.well-known/apple-developer-merchantid-domain-association'),
    path.join(__dirname, '../../public/.well-known/apple-developer-merchantid-domain-association'),
    path.join(process.cwd(), 'dist/spa/.well-known/apple-developer-merchantid-domain-association'),
    path.join(process.cwd(), 'public/.well-known/apple-developer-merchantid-domain-association'),
  ];
  
  let fileContent = null;
  let filePath = null;
  
  for (const filePathAttempt of possiblePaths) {
    try {
      if (fs.existsSync(filePathAttempt)) {
        fileContent = fs.readFileSync(filePathAttempt, 'utf8');
        filePath = filePathAttempt;
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }
  
  if (!fileContent) {
    console.error('Apple Pay file not found. Tried paths:', possiblePaths);
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);
    return res.status(500).json({ 
      error: 'File not found',
      tried: possiblePaths,
      cwd: process.cwd(),
      dirname: __dirname
    });
  }
  
  // Set correct headers
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Strong ETag
  const crypto = require('crypto');
  const etag = `"${crypto.createHash('md5').update(fileContent).digest('hex')}"`;
  res.setHeader('ETag', etag);
  
  console.log('Serving Apple Pay file from:', filePath);
  console.log('File size:', Buffer.byteLength(fileContent, 'utf8'), 'bytes');
  
  res.status(200).send(fileContent);
};
