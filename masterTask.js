'use strict';
const cp = require('child_process');
const colors = require('colors');
const messageTypes = require('./messageTypes');

var ids = [];
var workers = {};
var neighbors = {};
var ports = {};
var uidFromPorts = {};
var numWorkersConverged = 0;
var leader = null;
var spanningTree = {};
var terminated = false;

function connectToNeighbors(uid, {pid}) {
  let neighborsPorts = [];
  neighbors[uid].forEach((neighbor) => {
    neighborsPorts.push(ports[neighbor]);
  });
  let payload = {
    neighbors: neighborsPorts
  };
  let message = {
    type: messageTypes.INITIATE_CONNECTIONS,
    payload: payload
  };
  workers[uid].send(message);
  return;
}

function formAdjMatrix() {
  let adjMatrix = [];
  ids.forEach((node) => {
    let row = [];
    ids.forEach((neighbor) => {
      if (spanningTree[node].includes(neighbor)) {
        row.push(1);
      } else {
        row.push(0);
      }
    });
    adjMatrix.push(row);
  });
  console.log('\nAdjacency Matrix');
  console.log(adjMatrix);
  return;
}

function spawnProcesses(input) {
  neighbors = input.neighbors;
  ids = input.ids;
  for (let uid of input.ids) {
    let args = [];
    args.push(uid, input.source[uid]);
    workers[uid] = cp.fork('./worker', args);
  }
  return;
}

function startRound(uid, {converged, maxUid, parent, children}) {
  if (converged) {
    numWorkersConverged++;
    leader = maxUid;
    let row = children.map((port) => {
      return uidFromPorts[port];
    });
    spanningTree[uid] = row;
    if (parent) {
      spanningTree[uid].push(uidFromPorts[parent]);
    }
  }
  if (numWorkersConverged === Object.keys(neighbors).length && !terminated) {
    terminated = true;
    let message = {
      type: messageTypes.TERMINATE
    };
    for (uid of ids) {
      workers[uid].send(message);
    }
    setTimeout(() => {
      console.log('\nLeader: ' + leader);
      console.log('\nAdjacency List:');
      console.log(spanningTree);
      formAdjMatrix();
      process.exit();
    }, 300);
  } else {
    let message = {
      type: messageTypes.START_ROUND
    };
    workers[uid].send(message);
  }
  return;
}

module.exports = {
  connectToNeighbors,
  spawnProcesses,
  startRound,
  workers,
  ports,
  uidFromPorts
};
