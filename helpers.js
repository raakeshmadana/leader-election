const fs = require('fs');

function parseInput(inputFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFile, { encoding: 'utf8' }, (err, data) => {
      if(err) {
        return reject(err);
      }
      var lines = data.split('\n');
      var input = {};
      input.n = lines[0];
      input.ids = lines[1].split(' ');
      input.graph = [];
      //Use forEach whenever you are iterating via value and for(let iter in something) when you want to iterate via index.
      for(let i = 0; i < input.n; i++) {
        input.graph.push(lines[i + 2].split(' '));
      }
      return resolve(input);
    });
  });
}

module.exports = {
  parseInput
};
