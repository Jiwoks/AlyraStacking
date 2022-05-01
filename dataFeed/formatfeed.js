// const fs = require('fs');

// fs.readFile("./datafeed_kovan.txt", 'utf8', (err, data) => {
// 	console.log(data);
// })

let dataFeed = {};

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('datafeed_kovan.txt')
});

lineReader.on('line', function (line) {
	line = line.replace("\t", " ").split(" ");
	dataFeed.kovan[line[2]] = line;
	console.log(dataFeed);
});

