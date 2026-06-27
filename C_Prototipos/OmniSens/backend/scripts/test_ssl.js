const tls = require('tls');
const fs = require('fs');

const ca = `-----BEGIN CERTIFICATE-----
MIIDbzCCAlegAwIBAgIUT39mJ/NjufseQyTmiASomEgtLG8wDQYJKoZIhvcNAQEL
BQAwRzELMAkGA1UEBhMCQVIxEDAOBgNVBAgMB0NvcmRvYmExETAPBgNVBAoMCE9t
bmlTZW5zMRMwEQYDVQQDDApPbW5pU2Vuc0NBMB4XDTI2MDYxNjA2MDUwM1oXDTM2
MDYxMzA2MDUwM1owRzELMAkGA1UEBhMCQVIxEDAOBgNVBAgMB0NvcmRvYmExETAP
BgNVBAoMCE9tbmlTZW5zMRMwEQYDVQQDDApPbW5pU2Vuc0NBMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2i8t/geVCUZ0+SFl8cpaoBR7dXx1ujJVshDu
Mel4HFDqCIxzqGvFJEbdeerbnfMvln0O3knIb8e1YjsEdG8IlBYugCCKAAb328ve
bKBsNOMN907/fBoEKXuHyNdsNjTWr05wEqqDj4JMlfB+3KxiA3kZVIpcGv1IReQp
N5FVsH1R6UmBWClnU7vVzL+jFGUngiEbu7HZbpl9VqFbroDfybuphhPM05S6rGuE
Iom7MZBCVkgUKsQjZGmarfIU5hxMZDHMVhA7jKNnkDvrcQGRhkspX3Ib0J28vQZg
bMEhM0KPc/eJ1J38Dya7+h8mC6Es/K6tXFe2+F3YFB2FX5yFMwIDAQABo1MwUTAd
BgNVHQ4EFgQUoeIIBK3s4G/3K1rEamD+RvH1GjEwHwYDVR0jBBgwFoAUoeIIBK3s
4G/3K1rEamD+RvH1GjEwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC
AQEAKDgGeaQnPeO6X8BIwEb5t+CBt5NttJdgBJzK7SKS8+/ZKFTmtLn+WdgBp94g
mBD8i+fOYZhl73DW3kCVttHYV0EyLvokeXQmiq0fVMeQ0ktYgl+DyuWtNc62Kwsm
xCtIrpl2epZ09rb7JncagimtTANBHLF6gIDpr7eWZmhNqZtCtIUn6NLFpdblxMiG
AVzvcdknbWMP4DGiKua/wiAUBDj42xWI4qkgue9ErpIwwkPXg75GBexc1PgfFCJc
y7wUyHlXmCz8EiBlfRWqKdWxN6/qfe/XYgUKzr1zu+azJnPv+LSG9mFycvKCq+PN
9IdyVsJbVJhFQ1/eJ1IWLjyUYQ==
-----END CERTIFICATE-----`;

const options = {
  host: '3.90.242.143',
  port: 8883,
  ca: [ca],
  checkServerIdentity: (hostname, cert) => {
    console.log("Checking identity for:", hostname);
    console.log("Cert subject:", cert.subject);
    console.log("Cert SAN:", cert.subjectaltname);
    return tls.checkServerIdentity(hostname, cert);
  }
};

const socket = tls.connect(options, () => {
  console.log('client connected successfully, cert is VALID!');
  socket.end();
});

socket.on('error', (err) => {
  console.error('TLS Error:', err);
});
