const http = require('http');

const url = 'http://localhost:3000/uploads/general/file-1768299506469.jpeg';

http.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  res.resume();
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
