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
      userAgent.includes('axios');

    // Set Content-Type
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));

    // Only force download for regular browsers, not verification bots
    // Verification bots need to read the file as plain JSON
    if (!isVerificationBot) {
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="apple-developer-merchantid-domain-association"'
      );
    }

    // Send the file content
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error serving Apple Pay domain association file:', error);
    res
      .status(500)
      .json({ error: 'Failed to serve file', details: error.message });
  }
};
