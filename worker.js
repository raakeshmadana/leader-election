'use strict';
const net = require('net');
const colors = require('colors');

const messageTypes = require('./messageTypes');

const uid = process.argv[2];
const source = process.argv[3] === 'true' ? true: false;

var marked = source;
var maxUid = uid;
var parentWorker = null;
var rejectedWorkers = [];
var response = {};
var convergeCast = false;
var ackSent = false;
var childrenWorkers = [];
var terminate = false;
var count = 1;

const incomingConnections = [];
const outgoingConnections = [];

const tasks = {};
tasks[messageTypes.INITIATE_CONNECTIONS] = initiateConnections;
tasks[messageTypes.START_ROUND] = startRound;
tasks[messageTypes.TERMINATE] = stopFloodMax;


const server = net.createServer();

server.listen(process.pid, () => {
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
    maxUid: maxUid
  };
  if (marked) {
    outgoingConnections.forEach((outgoingConnection) => {
      if (outgoingConnection.remotePort === parentWorker) {
        message.bfs = null;
      } else if (rejectedWorkers.includes(outgoingConnection.remotePort)) {
        message.bfs = messageTypes.NACK;
      } else {
        message.bfs = messageTypes.EXPLORE;
      }
      outgoingConnection.write(JSON.stringify(message));
    });
    marked = false;
  } else {
    outgoingConnections.forEach((outgoingConnection) => {
      if (rejectedWorkers.includes(outgoingConnection.remotePort)) {
        message.bfs = messageTypes.NACK;
      } else if (convergeCast &&
        (outgoingConnection.remotePort === parentWorker)) {
          message.bfs = messageTypes.ACK;
          convergeCast = false;
          ackSent = true;
      } else if (terminate &&
        childrenWorkers.includes(outgoingConnection.remotePort)) {
          message.bfs = messageTypes.TERMINATE;
      } else {
        message.bfs = null;
      }
      outgoingConnection.write(JSON.stringify(message));
    });
  }
  terminate = false;
  rejectedWorkers = [];
  return;
}

function initiateConnections({neighbors}) {
  setUpConnectionListener(neighbors.length);
  neighbors.forEach((neighbor) => {
    response[neighbor] = false;
    let socket = net.createConnection(neighbor, () => {
      console.log(uid + ' connected to ' + neighbor);
    });
    outgoingConnections.push(socket);
  });
  return;
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

  // Find Max UID
  let uids = msgObjs.map((msgObj) => msgObj.maxUid);
  maxUid = Math.max(...uids, maxUid);
  console.log(uid + ' has seen ' + uids + '; max is ' + maxUid);

  // Process EXPLORE messages
  let exploreRequests = msgObjs.filter((msgObj) => {
    return msgObj.bfs === messageTypes.EXPLORE;
  });

  exploreRequests = exploreRequests.map((exploreRequest) => {
    return exploreRequest.source;
  });

  if (exploreRequests.length) {
    // Select parent worker
    if (!parentWorker && !source) {
      let randomIndex = Math.floor(Math.random() * exploreRequests.length);
      parentWorker = exploreRequests[randomIndex];
      marked = true;
    }
    // Keep track of processes that were rejected to be parents
    rejectedWorkers = exploreRequests.filter((exploreRequest) => {
      return exploreRequest !== parentWorker;
    });
  }

  // Process NACKs
  let nacks = msgObjs.filter((msgObj) => {
    return msgObj.bfs === messageTypes.NACK;
  });

  nacks = nacks.map((nack) => {
    return nack.source;
  });

  // Process ACKs
  let acks = msgObjs.filter((msgObj) => {
    return msgObj.bfs === messageTypes.ACK;
  });

  acks = acks.map((ack) => {
    return ack.source;
  });

  //Keep track of the responses received
  exploreRequests.forEach((exploreRequest) => {
    response[exploreRequest] = true;
  });
  nacks.forEach((nack) => {
    response[nack] = true;
  });
  // Add children
  acks.forEach((ack) => {
    response[ack] = true;
    childrenWorkers.push(ack);
  });
  // If all neighbors responded, start the convergecast
  if (Object.values(response).every((received) => received) && !ackSent &&
    !terminate && count) {
    if (source) {
      terminate = true;
    } else {
      convergeCast = true;
    }
    count--;
  }

  // Receive terminate message
  let termination = msgObjs.filter((msgObj) => {
    return msgObj.bfs === messageTypes.TERMINATE;
  });

  if (termination.length) {
    terminate = true;
  }

  let payload = {
    converged: false,
    maxUid: maxUid,
    parent: parentWorker,
    children: childrenWorkers
  };
  if (terminate) {
    payload.converged = true;
  }
  let message = {
    type: messageTypes.END_ROUND,
    source: uid,
    payload: payload
  };
  process.send(message);
  listener();
  return;
}

function startRound(parameters) {
  floodmax();
  return;
}

function setUpConnectionListener(numNeighbors) {
  server.on('connection', (socket) => {
    incomingConnections.push(socket);
    if (incomingConnections.length === numNeighbors) {
      let message = {
        type: messageTypes.CONNECTIONS_ESTABLISHED,
        source: uid,
        payload: {
          converged: false
        }
      };
      process.send(message);
      listener();
    }
  });
  return;
}

function stopFloodMax() {
  console.log(colors.green(uid + ' stopped floodmax'));
  process.exit();
}
