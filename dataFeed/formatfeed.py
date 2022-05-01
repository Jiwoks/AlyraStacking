import json

dataFeed = {}

def keyNotExists(_network, _token):
	if not dataFeed.get(_network):
		dataFeed[_network] = {}
	if not dataFeed[_network].get(_token):
		dataFeed[_network][_token] = {}

with open('datafeed_kovan.txt', 'r') as reader:
	for line in reader.readlines():
		line = line.split()
		keyNotExists('kovan', line[2])
		dataFeed['kovan'][line[2]][line[0]] = line[3]
with open('datafeed_rinkeby.txt', 'r') as reader:
	for line in reader.readlines():
		line = line.split()
		keyNotExists('rinkeby', line[2])
		dataFeed['rinkeby'][line[2]][line[0]] = line[3]

with open('dataFeed.json', 'w') as f:
	json.dump(dataFeed, f, indent=2)
