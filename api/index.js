const app = require('../server/index.js');

module.exports = (req, res) => {
  console.log(`[Vercel Serverless] Incoming request: ${req.method} ${req.url}`);
  
  // Ensure the request URL starts with /api so Express routes match it correctly
  if (req.url && !req.url.startsWith('/api')) {
    const oldUrl = req.url;
    req.url = '/api' + req.url;
    console.log(`[Vercel Serverless] Rewrote URL from ${oldUrl} to ${req.url}`);
  }
  
  return app(req, res);
};
