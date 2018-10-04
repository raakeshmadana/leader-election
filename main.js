'use strict';
const masterTask = require('./masterTask');
const master = require('./masterListener');
const helpers = require('./helpers');
const messageTypes = require('./messageTypes');

initiateFloodMax();

function initiateFloodMax() {
  const inputFile = process.argv[2];

  helpers.parseInput(inputFile).then(
    (input) => {
      console.log(input);
      return masterTask.spawnProcesses(input);
    },
    (err) => {
      console.log(err);
    }
  )
  .then((workers) => {
    master.listener(workers);
  });

  return;
}
