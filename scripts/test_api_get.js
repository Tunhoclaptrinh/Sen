const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/heritage-sites?limit=100',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      console.log('Count:', json.count);
      // Log first few items to see if they are the new ones
      if (json.data && json.data.length > 0) {
        console.log('Sample IDs:', json.data.map(i => i.id).join(', '));
        console.log('First Item Name:', json.data[0].name);
        console.log('Owners:', json.data.map(i => i.created_by).join(', '));
        console.log('Statuses:', json.data.map(i => i.status).join(', '));
      } else {
        console.log('Data is empty array');
      }
    } catch (e) {
      console.log('BODY:', data); // If not JSON
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
