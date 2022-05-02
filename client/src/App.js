import React, { Component } from "react";
import StackingTonted from "./contracts/StackingTonted.json";
import ERC20 from "./contracts/ERC20.json";
import getWeb3 from "./getWeb3";

import Header from "./components/Header/Header.js"
import NewStacking from "./components/Body/NewStacking";

import "./App.css";
import ListStacking from "./components/Body/ListStacking";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    blocStart: null,
    pools: null,
    };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = StackingTonted.networks[networkId];
      const instance = new web3.eth.Contract(
        StackingTonted.abi,
        deployedNetwork && deployedNetwork.address,
      );

      //tb: Get first block of the creation contract, for get events
      const txCreation = await web3.eth.getTransactionReceipt(deployedNetwork.transactionHash);
      const blocStart = txCreation.blockNumber;

      const eventsDeposit = await instance.getPastEvents('Deposited',
        {fromBlock: blocStart, toBlock: 'latest'})
      const eventsWithdraw = await instance.getPastEvents('Withdrawn',
        {fromBlock: blocStart, toBlock: 'latest'})
      
      let pools = new Map;
      eventsDeposit.forEach(e => {
        if (!pools[e.returnValues.token])
          pools[e.returnValues.token] = parseFloat(web3.utils.fromWei(e.returnValues.amount));
        else
          pools[e.returnValues.token] += parseFloat(web3.utils.fromWei(e.returnValues.amount));
      });
      eventsWithdraw.forEach(e => {
          pools[e.returnValues.token] -= parseFloat(web3.utils.fromWei(e.returnValues.amount));
      });

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, blocStart, pools });

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  deposit = async (token, amount) => {
    const erc20Contract = await new this.state.web3.eth.Contract(ERC20.abi, token);
    const weiAmount = this.state.web3.utils.toWei(amount);
    const spender = this.state.contract._address;
    await erc20Contract.methods.approve(spender, weiAmount).send({from: this.state.accounts[0]});
    await this.state.contract.methods.deposit(token, weiAmount).send({from: this.state.accounts[0]});
  }

  render() {

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div>
        <Header
          connected={this.state.accounts[0]}
        />
        <NewStacking
          deposit={this.deposit}
        />
        <ListStacking
          pools={this.state.pools}
        />
      </div>
    );
  }
}

export default App;
