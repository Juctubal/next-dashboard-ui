// This script sets up a secure HTTPS server for local development
// which is needed to access camera features in modern browsers
const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');
const path = require('path');

// Embedded self-signed certificates
// This is a convenience for development - NEVER use these certs in production
const CERT_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEMBIVCkFqbfn5
86rOzC0QBZZCrktHprIeE3IYYJqiJ8QksdQOwoxxkuE6WLFVaRGDLmhHOvKjSfzF
ZFmLwwF5jEUYpDK6ZV9kwGzf+HvSMUwGBzQ0hZiL5cAWkQHWOgL+SXO5wqx1fA3E
Ja8FYf7DJRKjhK6qHHHxSMekXKghq97qaN7Hy3b7u28whfM0mm/IpfChKr7M5Vx+
00Vzr2zvJMnvz88kYAcdJRrtHxC6lZgL6bsb4N1qvKCPviLwCR2/r9TdD1sJFvbL
Lf9o5+4T/TLOSGsmuMBOhvRPdl8M6JTsGPmQUhcFEVOLgP3A2aF4E3o8BmL83VLN
T+CwMCVvAgMBAAECggEAYf4fLH9oDGxMuYrYLizpDFVCvWTgD0JprSKnvbWYi+Da
c8JahXiHZdIDBnJGT93kXkN/jHYV39CUiAixw0UfHTxIXrwFHVXubhkCDOssmvUw
qAGW8cFVcJV9C0nEHCULyfVjL6LUHa9bfK/mQAi5GJNyUGUu8FdXbFDgDQYm6abW
bSw1ICQqYZqkbtUnAOxEWBQCGK0eLjcpxJNz9FNc7NbQBvOj2ZzBpw+JX5fYrLLc
MLajM/QfuLpnGWJhyW/v18fWykt3E5GUeJRbYYKqzJqVhDzKJMFWGNiXb0BoQRDn
cdu8cjvlFkLNxPQ+YYHm1EG7jYUMHbUAGeObxzE9AQKBgQD4+gxmEjMVVmeGWXKF
hC49sME7hD2/EiBjGsOYgMdDfv37+LK2a4oyAFUlcB3FAnkRoj+8Bx6wdQBLdnQR
0uEiKfygPv5+9x+o2Tu1DjDRE8FrVlK37Mf34J1k2Yxr+DBNoeuuPhUu45TAwpjJ
CIBaLgcjrNwgHW2tCdcX73HUrwKBgQDJ6t46xR0KTt8b6sV/GXjGZcahI+rItIGs
ZwNWGNFYQcnYCfCcUUy1fLUIchpugwXwgw9uvbZ6JgJTR/nrhjOQkFNRze+dOr7l
8DDUivT+yDXGx0+JECVcvZxEZO3VbiuRp1wiEKRxGK3xriJEUsmXRFzX59Dwvt/K
iHQSLNawQQKBgFcWOK/i5nYNk/Wp40oOf9PvQIdfGD5xZQiNZkDlJMoUVLtIR5pB
/5i1NNYQ+InFOG6HuJA69NTUXbxtR7pVlBzKN4rSk2BWafHY35KJOUY9om3pMPDa
35QMqAMG5l1nLxZ6N5l4aBNWbs9RGGaFZu37LUbLRPnF1AobOvmqKbGZAoGADfkT
rZVxLhbxQazplDdbgkb/Y5EMWV2drqUE0UUnS7pTDoI96k9BKKwzZgHSfECw4Qn9
4HTxxQpIWnEFP4YM+CnCQvLwBOx/QM8RwNI/hN3RJ19sYJE7csWQJIvZQ4r2GQIG
ZOk1wLLMZGvmU7JCv5ciQgNbMNZUGMR6yxR3C0ECgYEAw+qK7eiMDzrVcBIsPiZ/
aF5DIYXITwzNKITKdTHQPf9pnCAb78a7pwIq9WzHwG6ztEjQm0wBFvTFEw7q0GSx
+SX5VyF+jhAJPJ9oJIBUw8YX2+WHjlI/rUdf/Zt8Kf5m5uGcBZvX2FsQgaZIF8L8
bhLwfYLCiyhOQMwAfm+qV7U=
-----END PRIVATE KEY-----
`;

const CERT = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUOXxJWs2H9xpSA+RA/j95SUQhXnMwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMzA4MDExNjAyMTRaFw0yNDA3
MzExNjAyMTRaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDEMBIVCkFqbfn586rOzC0QBZZCrktHprIeE3IYYJqi
J8QksdQOwoxxkuE6WLFVaRGDLmhHOvKjSfzFZFmLwwF5jEUYpDK6ZV9kwGzf+HvS
MUwGBzQ0hZiL5cAWkQHWOgL+SXO5wqx1fA3EJa8FYf7DJRKjhK6qHHHxSMekXKgh
q97qaN7Hy3b7u28whfM0mm/IpfChKr7M5Vx+00Vzr2zvJMnvz88kYAcdJRrtHxC6
lZgL6bsb4N1qvKCPviLwCR2/r9TdD1sJFvbLLf9o5+4T/TLOSGsmuMBOhvRPdl8M
6JTsGPmQUhcFEVOLgP3A2aF4E3o8BmL83VLNT+CwMCVvAgMBAAGjUzBRMB0GA1Ud
DgQWBBTnFdvU7ZV1jEBfXrihiF52YKoJFDAfBgNVHSMEGDAWgBTnFdvU7ZV1jEBf
XrihiF52YKoJFDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQC1
rJYIf11CMiA/V/i9bzcl5qQiBz3v3YAwJdKLWRdRuBL5PU5JxuBPZMlmOXQWEpnT
LcGUxpxcpO5EmJ6AP2aNaJPC70rAVLWEiL9oWvj2tnQwxJxhIvGQBMHdh2/sKXmp
AHLLbVfQ0qT5c0zVQXrOFcYSzLesOJwYF9vv/nKVaLAGUNqP4OiUWnhRXLKPvXmK
+anEFn8cOZjsiyXWAqQv67G4+LkJjNNMRLWuF2fF2Innfo4WN8q9bRh8/0Qb0Qbx
qIbFoCdDiJxmG6noKZeZX2CFFJOQcxjUjjQSSPMfdXPRuLJZXHcpRKPUvYKbYZYW
+Jqc6Y9YZ9r6HWCw4Ff8
-----END CERTIFICATE-----
`;

// Write the embedded certificates to files
function setupCertificates() {
  const SSL_KEY_PATH = path.join(__dirname, 'localhost-key.pem');
  const SSL_CERT_PATH = path.join(__dirname, 'localhost.pem');
  
  // Only write the files if they don't already exist
  if (!fs.existsSync(SSL_KEY_PATH)) {
    fs.writeFileSync(SSL_KEY_PATH, CERT_KEY);
    console.log(`Created SSL key file at ${SSL_KEY_PATH}`);
  }
  
  if (!fs.existsSync(SSL_CERT_PATH)) {
    fs.writeFileSync(SSL_CERT_PATH, CERT);
    console.log(`Created SSL certificate file at ${SSL_CERT_PATH}`);
  }
  
  return {
    key: SSL_KEY_PATH,
    cert: SSL_CERT_PATH
  };
}

// Proxy server configuration
const TARGET_SERVER = 'http://localhost:3000'; // Your Next.js server
const PROXY_PORT = 3001;

function startSecureServer() {
  try {
    // Set up certificates from embedded values
    const certPaths = setupCertificates();
    
    // Create a proxy server instance
    const proxy = httpProxy.createProxyServer({
      // This helps with WebSocket support for Next.js hot reloading
      ws: true,
      // Configure secure proxy to handle HTTPS
      secure: false,
      // Add headers that might be needed
      changeOrigin: true
    });
    
    // Handle proxy errors
    proxy.on('error', (err, req, res) => {
      console.error('Proxy error:', err);
      if (res.writeHead) {
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Proxy error - is your Next.js server running?');
      }
    });
    
    // Load SSL certificates
    const ssl = {
      key: fs.readFileSync(certPaths.key),
      cert: fs.readFileSync(certPaths.cert)
    };
    
    // Create HTTPS server
    const server = https.createServer(ssl, (req, res) => {
      // Forward all requests to the Next.js server
      proxy.web(req, res, { target: TARGET_SERVER });
    });
    
    // Handle WebSocket connections for hot reloading
    server.on('upgrade', (req, socket, head) => {
      proxy.ws(req, socket, head, { target: TARGET_SERVER });
    });
    
    // Start server
    server.listen(PROXY_PORT, '0.0.0.0', () => {
      console.log(`\n✅ Secure HTTPS proxy running at https://localhost:${PROXY_PORT}`);
      console.log(`Forwarding all requests to ${TARGET_SERVER}`);
      console.log('\nTo use on your mobile device:');
      console.log(`- Make sure your phone is on the same WiFi network`);
      console.log(`- On your phone, navigate to: https://192.168.1.9:${PROXY_PORT}`);
      console.log('\nIMPORTANT: You will need to accept the security warning in your browser');
      console.log('This is expected when using self-signed certificates for development.\n');
    });
  } catch (error) {
    console.error('Error starting secure server:', error);
    process.exit(1);
  }
}

startSecureServer();
