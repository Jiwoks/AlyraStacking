PATH_FILE := .env
MNEMONIC := "$(shell cat .env | grep MNEMONIC | cut -d= -f2)"

all :
	ganache --mnemonic $(MNEMONIC)

rinkeby:
	ganache --fork.network rinkeby --mnemonic $(MNEMONIC)

ropsten:
	ganache --fork.network ropsten --mnemonic $(MNEMONIC)

kovan:
	ganache --fork.network kovan --mnemonic $(MNEMONIC)
