'use strict';
const net = require('net');
const messageTypes = require('./messageTypes');

const uid = process.argv[2];

const incomingConnections = [];
const outgoingConnections = [];

const tasks = {};
tasks[messageTypes.INITIATE_CONNECTIONS] = initiateConnections;
tasks[messageTypes.START_ROUND] = startRound;

var max_uid = uid;

const server = net.createServer();

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

function floodmax() {
  outgoingConnections.forEach((outgoingConnection) => {
    outgoingConnection.write(max_uid);
  });
}

function initiateConnections({ neighbors }) {
  setUpConnectionListener(neighbors.length);
  neighbors.forEach((neighbor) => {
    let socket = net.createConnection(neighbor, () => {
      console.log(uid + ' connected to ' + neighbor);
    });
    outgoingConnections.push(socket);
  });
}

function listener() {
  let promises = [];
  for(let incomingConnection of incomingConnections) {
    promises.push(new Promise((resolve, reject) => {
      incomingConnection.once('data', (message) => {
        return resolve(message.toString());
      });
    }));
  }
  Promise.all(promises).then(processMessages);
}

function processMessages(uids) {
  max_uid = Math.max(...uids, max_uid).toString();
  console.log(uid + ' has seen ' + uids + '; max is ' + max_uid);
  let payload = {
    terminated: false,
    leader: max_uid,
  };
  let message = {
    type: messageTypes.END_ROUND,
    source: uid,
    payload: payload
  };
  process.send(message);
  listener();
}

function startRound(parameters) {
  floodmax();
}

function setUpConnectionListener(numNeighbors) {
  server.on('connection', (socket) => {
    incomingConnections.push(socket);
    if(incomingConnections.length == numNeighbors) {
      let message = {
        type: messageTypes.CONNECTIONS_ESTABLISHED,
        source: uid
      };
      process.send(message);
      listener();
    }
  });
}
