const cp = require('child_process');
const parseInput = require('./parseInput');

var input = {};
var workers = {};
var ports = {};
var promises = [];

const inputFile = process.argv[2];

parseInput(inputFile).then(
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
  pids.forEach((pid) => {
    ports[pid.uid] = pid.port;
  });

  for(let i = 0; i < input.n; i++) {
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
});

spawnProcesses = (input) => {
  for(let i = 0; i < input.n; i++) {
    let args = [];
    let uid = input.ids[i];
    args.push(uid);
    workers[uid] = cp.fork('./worker', args);
  }

  for(let worker in workers) {
    promises.push(new Promise((resolve, reject) => {
      workers[worker].on('message', (pid) => {
        resolve(pid);
      });
    }));
  }

  return Promise.all(promises);
}
