// Temporary API route to serve the CORRECT file and override any cached version
const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  // Read the CORRECT file from public directory
  const filePath = path.join(__dirname, '../../public/.well-known/apple-developer-merchantid-domain-association');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
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
    
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error serving Apple Pay file:', error);
    res.status(500).send('Internal Server Error');
  }
};
