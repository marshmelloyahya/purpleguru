const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Next.js config
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Use the dynamic port assigned by Namecheap Passenger, or default to 3000
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    // Parse routing
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
