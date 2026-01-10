/**
 * Local Test API Server
 * Run this server to enable test execution from the Test Runner page
 *
 * Usage: node test-server.js
 * Then access the app at http://localhost:9000 and navigate to /test-runner
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Import the test runner API
const runTestsHandler = require('../api/run-tests');

// Mount the test runner endpoint
app.post('/api/run-tests', runTestsHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test API server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Test API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log('\n💡 Make sure your Quasar dev server is running on port 9000');
  console.log('💡 Then navigate to http://localhost:9000/test-runner\n');
});

// Handle errors
app.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down test server...');
  process.exit(0);
});
