'use strict';
const masterTask = require('./masterTask');
const messageTypes = require('./messageTypes');

const tasks = {};
tasks[messageTypes.PID] = masterTask.connectToNeighbors;
var workers = {};

function listener(processes) {
  workers = processes;
  let promises = [];
  for(let worker in workers) {
    promises.push(new Promise((resolve, reject) => {
      workers[worker].on('message', (message) => {
        let task = tasks[message.type];
        let uid = message.source;
        let parameters = message.payload;
        if(message.type == messageTypes.PID) {
          masterTask.ports[uid] = parameters.pid;
        }
        return resolve({ task, uid, parameters });
      });
    }));
  }
  Promise.all(promises).then(listenerHandle);
};

function listenerHandle(operations) {
  operations.forEach((operation) => {
    operation.task(workers[operation.uid], operation.uid, operation.parameters);
  });
}

module.exports = {
  listener
};
