import fs from 'fs';
import path from 'path';

export default {
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'C:\\Users\\c1bra\\Documents\\GitHub\\xrLego\\localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'C:\\Users\\c1bra\\Documents\\GitHub\\xrLego\\localhost.pem')),
    },
    // Make sure the server is accessible over the local network
    host: '0.0.0.0',
  },
};
