import fs from 'fs';
import path from 'path';

export default {
  server: {
    https: {
<<<<<<< HEAD
      key: fs.readFileSync(path.resolve(__dirname, 'C:\\Users\\c1bra\\Documents\\GitHub\\xrLego\\localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'C:\\Users\\c1bra\\Documents\\GitHub\\xrLego\\localhost.pem')),
=======
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
>>>>>>> 9015099dd1a49a48c19efc0e9a7c0169f136aab1
    },
    // Make sure the server is accessible over the local network
    host: '0.0.0.0',
  },
};
