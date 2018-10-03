'use strict';
const masterTask = require('./masterTask');
const helpers = require('./helpers');
const messageTypes = require('./messageTypes');

var input = {};

initiateFloodMax();

function initiateFloodMax() {
  const inputFile = process.argv[2];

  helpers.parseInput(inputFile).then(
    (data) => {
      input = data;
    },
    (err) => {
      console.log(err);
    }
  )
  .then(() => {
    return masterTask.spawnProcesses(input);
  })
  .then((pids) => {
    return masterTask.connectToNeighbors(pids, input);
  })
  .then((message) => {
    console.log('All connections established');
  });

  return;
}
