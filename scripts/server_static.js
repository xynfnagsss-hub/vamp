const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist', 'client');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(root, req.url.split('?')[0]);
  if (req.url === '/' || req.url === '') filePath = path.join(root, 'index.html');
  fs.stat(filePath, (err, stat) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    stream.pipe(res);
  });
});

server.listen(port, () => console.log(`Static server serving ${root} on http://localhost:${port}`));
