'use strict';
const cp = require('child_process');

var neighbors = {};
var ports = {};

function connectToNeighbors(worker, uid, { pid }) {
  let neighborsPorts = [];
  neighbors[uid].forEach((neighbor) => {
    neighborsPorts.push(ports[neighbor]);
  });
  worker.send(neighborsPorts);
}

function spawnProcesses(input) {
  neighbors = input.neighbors;
  let workers = {};
  for(let uid of input.ids) {
    let args = [];
    args.push(uid);
    workers[uid] = cp.fork('./worker', args);
  }
  return workers;
}

module.exports = {
  connectToNeighbors,
  spawnProcesses,
  ports
};
