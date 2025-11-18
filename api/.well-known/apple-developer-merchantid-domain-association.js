const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  // Read the file from public directory
  const filePath = path.join(__dirname, '../../public/.well-known/apple-developer-merchantid-domain-association');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Set correct headers for Apple Pay domain verification
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));
    res.setHeader('Content-Encoding', 'identity');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Use strong ETag (no W/ prefix)
    const etag = `"${require('crypto').createHash('md5').update(fileContent).digest('hex')}"`;
    res.setHeader('ETag', etag);
    
    // Handle If-None-Match for caching
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error serving Apple Pay domain association file:', error);
    res.status(500).send('Internal Server Error');
  }
};
