const fs = require('fs');

module.exports = (inputFile) => {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFile, { encoding: 'utf8' }, (err, data) => {
      if(err) {
        reject(err);
      }

      var lines = data.split('\n');

      var input = {};
      input.n = lines[0];
      input.ids = lines[1].split(' ');
      input.graph = [];
      for(let i = 0; i < input.n; i++) {
        input.graph.push(lines[i + 2].split(' '));
      }

      resolve(input);
    });
  });
}
