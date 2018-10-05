'use strict';
const masterTask = require('./masterTask');
const messageTypes = require('./messageTypes');

const tasks = {};
tasks[messageTypes.PID] = masterTask.connectToNeighbors;
tasks[messageTypes.CONNECTIONS_ESTABLISHED] = masterTask.startRound;
tasks[messageTypes.END_ROUND] = masterTask.startRound;

function listener() {
  let promises = [];
  for(let worker in masterTask.workers) {
    promises.push(new Promise((resolve, reject) => {
      masterTask.workers[worker].once('message', (message) => {
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
}

function listenerHandle(operations) {
  if(!masterTask.terminated) {
    listener();
  }
  operations.forEach((operation) => {
    operation.task(masterTask.workers[operation.uid], operation.uid, operation.parameters);
  });
}

module.exports = {
  listener
};
