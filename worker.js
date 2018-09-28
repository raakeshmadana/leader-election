const net = require('net');

const uid = process.argv[2];
var neighbors = [];

const server = net.createServer((socket) => {
  console.log(socket.remotePort + ' connected to ' + uid);
});

server.listen(process.pid, () => {
  console.log(uid + ' listening at ' +  process.pid);
  process.send({ uid: uid, port: process.pid });
});

process.on('message', (message) => {
  neighbors = message;
  console.log(neighbors);
  neighbors.forEach((neighbor) => {
    net.createConnection(neighbor, () => {
      console.log(uid + ' connected to ' + neighbor);
    });
  });
});
