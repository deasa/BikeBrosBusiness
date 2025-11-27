import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.tsx': 'text/javascript',
  '.ts': 'text/javascript'
};

const server = http.createServer(async (req, res) => {
  // Handle root request
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);
  
  // Strip query strings
  filePath = filePath.split('?')[0];

  let ext = path.extname(filePath);
  
  // Intelligent resolution for imports without extensions (e.g. './App')
  if (!ext || ext === '') {
    const extensions = ['.tsx', '.ts', '.js', '.jsx'];
    for (const e of extensions) {
        try {
            await fs.access(filePath + e);
            filePath = filePath + e;
            ext = e;
            break;
        } catch {}
    }
  }

  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // SPA Fallback: serve index.html for non-asset routes
      // This allows React Router (if used) or simple SPA logic to handle the URL
      if (!ext || ext === '.html') {
          try {
            const indexData = await fs.readFile(path.join(__dirname, 'index.html'));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexData);
          } catch(e) {
             res.writeHead(500);
             res.end('Error loading index.html');
          }
      } else {
          res.writeHead(404);
          res.end('Not found');
      }
    } else {
      res.writeHead(500);
      res.end(`Server Error: ${error.code}`);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});