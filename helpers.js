'use strict';
const fs = require('fs');

function parseInput(inputFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFile, {encoding: 'utf8'}, (err, data) => {
      if (err) {
        return reject(err);
      }

      let lines = data.split('\n');
      let input = {};
      input.numWorkers = lines[0];
      input.ids = lines[1].split(' ');
      input.neighbors = {};

      let graph = [];
      for (let i = 0; i < input.numWorkers; i++) {
        let row = lines[i + 2].split(' ');
        graph.push(row.map(ele => Number(ele)));
      }

      for (let i in graph) {
        let neighbors = [];
        for (let j in graph[i]) {
          if (graph[i][j] === 1) {
            neighbors.push(input.ids[j].toString());
          }
        }
        input.neighbors[input.ids[i]] = neighbors;
      }

      return resolve(input);
    });
  });
}

module.exports = {
  parseInput
};
