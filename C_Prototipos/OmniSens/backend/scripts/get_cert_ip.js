const tls = require('tls');

const options = {
  host: '3.90.242.143',
  port: 8883,
  rejectUnauthorized: false
};

const socket = tls.connect(options, () => {
  const cert = socket.getPeerCertificate(true);
  let currentCert = cert;
  let certs = [];
  
  while (currentCert) {
    const pem = '-----BEGIN CERTIFICATE-----\n' + 
                currentCert.raw.toString('base64').match(/.{1,64}/g).join('\n') + 
                '\n-----END CERTIFICATE-----';
    certs.push({
      subject: currentCert.subject,
      issuer: currentCert.issuer,
      pem: pem
    });
    
    if (currentCert.issuerCertificate === currentCert) break;
    currentCert = currentCert.issuerCertificate;
    if (!currentCert) break;
  }
  
  console.log(JSON.stringify(certs, null, 2));
  socket.end();
});

socket.on('error', (err) => {
  console.error('TLS Error:', err);
});
