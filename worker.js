'use strict';
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
  console.log(uid + ' ' + neighbors);

  let promises = [];
  neighbors.forEach((neighbor) => {
    promises.push(new Promise((resolve, reject) => {
      net.createConnection(neighbor, () => {
        console.log(uid + ' connected to ' + neighbor);
        return resolve('connected');
      });
    }));
  });

  Promise.all(promises).then((message) => {
    process.send(message);
  });
});
