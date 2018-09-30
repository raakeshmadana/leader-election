const fs = require('fs');
//Like I mentioned that day, reject and resolve are just function calls, you need to return the callback.
//If you don't you will run into unecessary errors (hard to debug).
//TODO : Your function that you are exporting is bad style of coding; rather define function and then export it.
module.exports = (inputFile) => {
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
