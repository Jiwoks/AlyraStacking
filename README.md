# Projet 3

# Alyra - Project 4 - Stacking

## Table of contents

- [TOC](#Table-of-contents)
- [Subject](#Subject)
    - [Your DApp must allow](#Your-DApp-must-allow)
    - [Recommendations and requirements](#Recommendations-and-requirements)
    - [To give back](#To-give-back)
- [Team](#Team)

---

---

## Subject

Create a DApp that allows stacking !
 > **What's Stakcing?**
 >
 > Staking consists of blocking an X quantity of cryptocurrencies in a smart contract or a wallet in order to assist the network. For this action, the holder of the staked cryptocurrencies is rewarded in the form of tokens, a reward that can be likened to crypto-dividends or interest.

> **Quel est l'intérêt de faire du Staking ?**
> 
> Staking allows an investor to earn interest or dividends rather than letting their cryptocurrencies “sleep” without generating profits.
>
> To put this concept into practice you will need to build a Dapp that allows users to stake (immobilize) any ERC20 token and automate the issuance of rewards to stakers (liquidity providers) in the form of tokens.
>
> The token reward received by users is a very important part of your Dapp. It must be proportional to the amount of funds blocked on the smart contract. To do this, you need the current market value of the locked asset, which you can retrieve using Chainlink's oracle.
>
> Obtaining price data from Chainlink gives you a way to compare the value of tokens locked on the smart contract. You can easily convert the value of any ERC20 token to its ETH value to calculate and determine the exact reward value.

### **Your DApp must allow:**

- [x] Stake your ERC20 token
- [x] Unstake his tokens
- [x] Create your own reward token or use ETH or another ERC20 token (Dai for example)
- [x] The amount of the reward must be proportional to the value locked on the smart contract

### **Recommendations and requirements:**

- [x] Using the Chainlink Oracle
- [x] The protocol should allow any staked crypto to be translated into a "main" unit(USDC, ETH, whatever).
- [x] The rewards are made in token of the protocol (created therefore), and they are based on the value locked in the protocol by a user on a token on ( / ) the complete value locked on this token

### **To give back :**

- [Link to your Github repository](https://github.com/Jiwoks/AlyraStacking)
- [Link to dApp in test network]()
- [Video Front]()
- [Video SmartContracts]()
- [Video TestUnits]()
- [Organization]()


## Team:
Damien Barrere [github](https://github.com/Jiwoks)
Michael Petit [github](https://github.com/mickpetit)
Teddy Blanco [github](https://github.com/tonTed)
