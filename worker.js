'use strict';
const net = require('net');
const messageTypes = require('./messageTypes');

const uid = process.argv[2];
var neighbors = [];
const tasks = {};
tasks[messageTypes.INITIATE_CONNECTIONS] = initiateConnections;

const server = net.createServer((socket) => {
  console.log(socket.remotePort + ' connected to ' + uid);
});

server.listen(process.pid, () => {
  console.log(uid + ' listening at ' +  process.pid);
  let payload = { pid: process.pid};
  let message = {
    source: uid,
    type: messageTypes.PID,
    payload: payload
  };
  process.send(message);
});

process.on('message', (message) => {
  let task = tasks[message.type];
  let payload = message.payload;
  task(payload);
});

function initiateConnections({ neighbors }) {
  let promises = [];
  neighbors.forEach((neighbor) => {
    promises.push(new Promise((resolve, reject) => {
      net.createConnection(neighbor, () => {
        console.log(uid + ' connected to ' + neighbor);
        return resolve();
      });
    }));
  });

  Promise.all(promises).then(() => {
    let message = {
      type: messageTypes.CONNECTIONS_ESTABLISHED,
      source: uid
    };
    process.send(message);
  });
}
