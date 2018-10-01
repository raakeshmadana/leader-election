const cp = require('child_process');
const helpers = require('./helpers');

var input = {};
var workers = {};
var ports = {};

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
  return spawnProcesses(input);
})
.then((pids) => {
  return connectToNeighbors(pids);
})
.then((message) => {
  console.log('All connections established');
});

function spawnProcesses(input) {
  for(let uid of input.ids) {
    let args = [];
    args.push(uid);
    workers[uid] = cp.fork('./worker', args);
  }

  let promises = [];
  for(let worker in workers) {
    promises.push(new Promise((resolve, reject) => {
      workers[worker].on('message', (pid) => {
        return resolve(pid);
      });
    }));
  }

  return Promise.all(promises);
}

function connectToNeighbors(pids) {
  pids.forEach((pid) => {
    ports[pid.uid] = pid.port;
  });

  for(let i = 0; i < input.numWorkers; i++) {
    let neighbors = [];
    for(let j = 0; j < input.graph[i].length; j++) {
      if(input.graph[i][j] == 1) {
        let uid = input.ids[j].toString();
        neighbors.push(ports[uid]);
      }
    }
    let worker = input.ids[i];
    workers[worker].send(neighbors);
  }

  let promises = [];
  for(let worker in workers) {
    promises.push(new Promise((resolve, reject) => {
      workers[worker].on('message', (message) => {
        return resolve(message);
      });
    }));
  }

  return Promise.all(promises);
}
