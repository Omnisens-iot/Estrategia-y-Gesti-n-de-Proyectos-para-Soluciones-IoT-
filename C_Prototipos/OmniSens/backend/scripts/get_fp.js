const tls = require('tls');
const crypto = require('crypto');

const options = {
  host: '3.90.242.143',
  port: 8883,
  rejectUnauthorized: false
};

const socket = tls.connect(options, () => {
  const cert = socket.getPeerCertificate(true);
  // Get fingerprint (SHA1)
  const fp = crypto.createHash('sha1').update(cert.raw).digest('hex').toUpperCase().match(/.{1,2}/g).join(':');
  console.log('SHA1 Fingerprint:', fp);
  // Get SHA256 just in case
  const fp256 = crypto.createHash('sha256').update(cert.raw).digest('hex').toUpperCase().match(/.{1,2}/g).join(' ');
  console.log('SHA256 Fingerprint:', fp256);
  socket.end();
});

socket.on('error', (err) => {
  console.error('TLS Error:', err);
});
