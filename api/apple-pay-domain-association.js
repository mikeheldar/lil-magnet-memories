const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    // Read the file from the public directory
    const filePath = path.join(
      process.cwd(),
      'public',
      '.well-known',
      'apple-developer-merchantid-domain-association'
    );

    // Try to read the file
    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (readError) {
      // If file not found in public, try dist/spa
      const distPath = path.join(
        process.cwd(),
        'dist',
        'spa',
        '.well-known',
        'apple-developer-merchantid-domain-association'
      );
      try {
        fileContent = fs.readFileSync(distPath, 'utf8');
      } catch (distError) {
        console.error(
          'File not found in public or dist:',
          readError,
          distError
        );
        return res.status(404).json({ error: 'File not found' });
      }
    }

    // Check if this is a verification bot (Square, Apple, etc.)
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isVerificationBot =
      userAgent.includes('square') ||
      userAgent.includes('apple') ||
      userAgent.includes('bot') ||
      userAgent.includes('crawler') ||
      userAgent.includes('spider') ||
      userAgent.includes('curl') ||
      userAgent.includes('wget') ||
      userAgent.includes('postman') ||
      userAgent.includes('insomnia') ||
      userAgent.includes('python') ||
      userAgent.includes('go-http') ||
      userAgent.includes('java') ||
      userAgent.includes('node-fetch') ||
      userAgent.includes('axios') ||
      !userAgent; // Empty user agent might be a bot

    // Calculate content length
    const contentLength = Buffer.byteLength(fileContent, 'utf8');

    // Set headers - CRITICAL: These must be set exactly as shown
    // to prevent compression, chunking, or any modification
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', contentLength.toString());
    
    // Prevent compression and chunking
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Explicitly disable compression (Vercel respects this)
    res.setHeader('Content-Encoding', 'identity');
    
    // Only force download for regular browsers, not verification bots
    if (!isVerificationBot) {
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="apple-developer-merchantid-domain-association"'
      );
    }

    // Send the file content - use writeHead to ensure headers are set before body
    res.writeHead(200);
    res.end(fileContent);
  } catch (error) {
    console.error('Error serving Apple Pay domain association file:', error);
    res
      .status(500)
      .json({ error: 'Failed to serve file', details: error.message });
  }
};
