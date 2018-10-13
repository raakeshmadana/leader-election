'use strict';
const cp = require('child_process');
const colors = require('colors');
const messageTypes = require('./messageTypes');

var terminated = false;
var ids = [];
var workers = {};
var neighbors = {};
var ports = {};
var uidFromPorts = {};
var numWorkersTerminated = 0;
var leader = null;
var spanningTree = {};

function connectToNeighbors(worker, uid, {pid}) {
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
  worker.send(message);
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
  console.log(adjMatrix);
}

function printConnectionStatus(worker, uid, parameters) {
  console.log(uid + ' connected to all its neighbors');
  terminated = true;
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

function startRound(worker, uid, parameters) {
  if (parameters.terminated) {
    numWorkersTerminated++;
    leader = parameters.leader;
    let row = parameters.children.map((port) => {
      return uidFromPorts[port];
    });
    spanningTree[uid] = row;
    if (parameters.parent) {
      spanningTree[uid].push(uidFromPorts[parameters.parent]);
    }
    if (numWorkersTerminated === Object.keys(neighbors).length) {
      // Construct Adjacency matrix
      formAdjMatrix();
      console.log(leader, spanningTree);
    }
    console.log(colors.green(uid, parameters.leader, parameters.parent,
      parameters.children));
  }
  let message = {
    type: messageTypes.START_ROUND
  };
  worker.send(message);
}

module.exports = {
  connectToNeighbors,
  spawnProcesses,
  startRound,
  printConnectionStatus,
  workers,
  ports,
  uidFromPorts,
  terminated
};
