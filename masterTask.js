'use strict';
const cp = require('child_process');
const messageTypes = require('./messageTypes');

var terminated = false;
var workers = {};
var neighbors = {};
var ports = {};

function connectToNeighbors(worker, uid, { pid }) {
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
  for(let uid of input.ids) {
    let args = [];
    args.push(uid);
    workers[uid] = cp.fork('./worker', args);
  }
  return;
}

module.exports = {
  connectToNeighbors,
  spawnProcesses,
  printConnectionStatus,
  workers,
  ports,
  terminated
};
