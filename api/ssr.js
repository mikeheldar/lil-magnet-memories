// Vercel Serverless Function Entry Point for Quasar SSR
// This wraps the Quasar SSR Express app to work with Vercel's serverless functions

module.exports = async (req, res) => {
  // Dynamically import the built SSR app
  // Note: This will only work after the build completes
  try {
    const { default: app } = await import('../dist/ssr/index.js');
    
    // Let Express handle the request
    return app(req, res);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).json({ 
      error: 'SSR failed to initialize',
      message: error.message 
    });
  }
};
