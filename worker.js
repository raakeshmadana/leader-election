'use strict';
const net = require('net');
const messageTypes = require('./messageTypes');

const uid = process.argv[2];
const source = process.argv[3] === 'true' ? true: false;

var marked = source;
var maxUid = uid;
var parentWorker = null;

const incomingConnections = [];
const outgoingConnections = [];

const tasks = {};
tasks[messageTypes.INITIATE_CONNECTIONS] = initiateConnections;
tasks[messageTypes.START_ROUND] = startRound;


const server = net.createServer();

server.listen(process.pid, () => {
  console.log(uid + ' listening at ' +  process.pid);
  let payload = {pid: process.pid};
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
  let message = {
    source: process.pid,
    maxUid: maxUid,
    bfs: null
  };
  if(marked) {
    message.bfs = messageTypes.EXPLORE;
    marked = false;
  }
  outgoingConnections.forEach((outgoingConnection) => {
    outgoingConnection.write(JSON.stringify(message));
  });
}

function initiateConnections({neighbors}) {
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
  for (let incomingConnection of incomingConnections) {
    promises.push(new Promise((resolve, reject) => {
      incomingConnection.once('data', (message) => {
        return resolve(message);
      });
    }));
  }
  Promise.all(promises).then(processMessages);
}

function processMessages(messages) {
  let msgObjs = messages.map((message) => JSON.parse(message));

  let uids = msgObjs.map((msgObj) => msgObj.maxUid);
  maxUid = Math.max(...uids, maxUid).toString();

  let exploreRequests = [];
  msgObjs.forEach((msgObj) => {
    if(msgObj.bfs === messageTypes.EXPLORE) {
      console.log(uid, msgObj.source, msgObj.bfs);
      exploreRequests.push(msgObj.source);
    }
  });

  if(exploreRequests.length && !parentWorker && !source) {
    let randomIndex = Math.floor(Math.random() * exploreRequests.length);
    parentWorker = exploreRequests[randomIndex];
    marked = true;
    console.log(uid, parentWorker);
  }
  //console.log(uid + ' has seen ' + uids + '; max is ' + maxUid);
  let payload = {
    terminated: false,
    leader: maxUid,
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
    if (incomingConnections.length === numNeighbors) {
      let message = {
        type: messageTypes.CONNECTIONS_ESTABLISHED,
        source: uid
      };
      process.send(message);
      listener();
    }
  });
}
