const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
  };

  console.log('=== Apple Pay Domain Association Request ===');
  console.log('Method:', logData.method);
  console.log('URL:', logData.url);
  console.log('User-Agent:', req.headers['user-agent'] || '(empty)');
  console.log('Accept-Encoding:', req.headers['accept-encoding'] || '(empty)');
  console.log('All Headers:', JSON.stringify(req.headers, null, 2));

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
    let fileSource = 'public';
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
        fileSource = 'dist/spa';
      } catch (distError) {
        console.error(
          'File not found in public or dist:',
          readError,
          distError
        );
        return res.status(404).json({ error: 'File not found' });
      }
    }

    console.log('File source:', fileSource);
    console.log('File content length (chars):', fileContent.length);
    console.log('File content preview (first 100 chars):', fileContent.substring(0, 100));

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

    console.log('Is Verification Bot:', isVerificationBot);
    console.log('User-Agent (lowercase):', userAgent || '(empty)');

    // Calculate content length
    const contentLength = Buffer.byteLength(fileContent, 'utf8');
    console.log('Content-Length (bytes):', contentLength);

    // Set headers - CRITICAL: These must be set exactly as shown
    // to prevent compression, chunking, or any modification
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': contentLength.toString(),
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Encoding': 'identity',
    };

    // Only force download for regular browsers, not verification bots
    if (!isVerificationBot) {
      responseHeaders['Content-Disposition'] =
        'attachment; filename="apple-developer-merchantid-domain-association"';
    }

    console.log('Response Headers:', JSON.stringify(responseHeaders, null, 2));

    // Set all headers
    Object.keys(responseHeaders).forEach((key) => {
      res.setHeader(key, responseHeaders[key]);
    });

    // Send the file content - use writeHead to ensure headers are set before body
    console.log('Sending response with status 200');
    console.log('File content ends with (last 100 chars):', fileContent.substring(fileContent.length - 100));
    
    res.writeHead(200);
    res.end(fileContent);
    
    console.log('Response sent successfully');
    console.log('=== End Request ===\n');
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error serving Apple Pay domain association file:', error);
    console.error('Error stack:', error.stack);
    console.error('=== End Error ===\n');
    res
      .status(500)
      .json({ error: 'Failed to serve file', details: error.message });
  }
};
