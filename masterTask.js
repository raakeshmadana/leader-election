'use strict';
const cp = require('child_process');
const messageTypes = require('./messageTypes');

var terminated = false;
var workers = {};
var neighbors = {};
var ports = {};

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

function printConnectionStatus(worker, uid, parameters) {
  console.log(uid + ' connected to all its neighbors');
  terminated = true;
}

function spawnProcesses(input) {
  neighbors = input.neighbors;
  for (let uid of input.ids) {
    let args = [];
    args.push(uid, input.source[uid]);
    workers[uid] = cp.fork('./worker', args);
  }
  return;
}

function startRound(worker, uid, parameters) {
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
  terminated
};
