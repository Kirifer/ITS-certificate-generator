const net = require('net');

const socket = net.createConnection(587, 'smtp.office365.com', () => {
  console.log('Connected to smtp.office365.com on port 587');
  socket.end();
});

socket.on('error', (err) => {
  console.error('Connection failed:', err.message);
});
