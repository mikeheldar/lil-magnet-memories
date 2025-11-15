const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    // This endpoint is for downloads only (via ?download=true query parameter)
    // The main file is served as static for Square verification
    
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

    // Set headers to force download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="apple-developer-merchantid-domain-association"'
    );
    res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));

    // Send the file content
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error serving Apple Pay domain association file:', error);
    res
      .status(500)
      .json({ error: 'Failed to serve file', details: error.message });
  }
};
