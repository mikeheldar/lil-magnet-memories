// API route to serve the CORRECT Apple Pay file and override cached version
// This reads from the built dist/spa/.well-known/ directory
const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  // Try multiple possible paths where the file might be in Vercel's environment
  const possiblePaths = [
    // Vercel build output (most likely)
    path.join(process.cwd(), '.vercel/output/static/.well-known/apple-developer-merchantid-domain-association'),
    path.join(process.cwd(), 'dist/spa/.well-known/apple-developer-merchantid-domain-association'),
    path.join(process.cwd(), '.well-known/apple-developer-merchantid-domain-association'),
    // Relative to API directory
    path.join(__dirname, '../../dist/spa/.well-known/apple-developer-merchantid-domain-association'),
    path.join(__dirname, '../../public/.well-known/apple-developer-merchantid-domain-association'),
    path.join(__dirname, '../../.well-known/apple-developer-merchantid-domain-association'),
    // Absolute paths
    '/var/task/dist/spa/.well-known/apple-developer-merchantid-domain-association',
    '/var/task/public/.well-known/apple-developer-merchantid-domain-association',
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
  
  // If still not found, try reading the file content directly (embedded fallback)
  if (!fileContent) {
    // Last resort: try to read from the source file that should be in the repo
    const fallbackPath = path.join(__dirname, '../../public/.well-known/apple-developer-merchantid-domain-association');
    try {
      if (fs.existsSync(fallbackPath)) {
        fileContent = fs.readFileSync(fallbackPath, 'utf8');
        filePath = fallbackPath;
      }
    } catch (err) {
      // Ignore
    }
  }
  
  if (!fileContent) {
    console.error('Apple Pay file not found. Tried paths:', possiblePaths);
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);
    console.error('Environment:', process.env.VERCEL ? 'Vercel' : 'Local');
    
    // Return a proper error response
    res.status(500).setHeader('Content-Type', 'text/plain');
    return res.send(`Error: Apple Pay domain association file not found.\nTried: ${possiblePaths.join(', ')}\nCWD: ${process.cwd()}\nDirname: ${__dirname}`);
  }
  
  // Verify file size (should be 9099 bytes)
  const fileSize = Buffer.byteLength(fileContent, 'utf8');
  if (fileSize !== 9099) {
    console.warn(`Warning: File size is ${fileSize} bytes, expected 9099 bytes`);
  }
  
  // Set correct headers
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', fileSize.toString());
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Strong ETag based on content
  const crypto = require('crypto');
  const etag = `"${crypto.createHash('md5').update(fileContent).digest('hex')}"`;
  res.setHeader('ETag', etag);
  
  // Add Last-Modified header
  try {
    const stats = fs.statSync(filePath);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
  } catch (err) {
    // Ignore if can't get stats
  }
  
  console.log('Serving Apple Pay file from:', filePath);
  console.log('File size:', fileSize, 'bytes');
  
  res.status(200).send(fileContent);
};
