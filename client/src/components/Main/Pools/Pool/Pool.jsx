import React, {useEffect, useState} from 'react';
import './Pool.css';
import walletStore from "../../../../stores/wallet";
import {deposit, withdraw, getWalletBalance, getDepositedBalance, getTVL} from "../../../../helpers/contract";
import Operation from "./Operation/Operation";
import web3js from "web3";
import {toast} from 'react-toastify';

function Pool({pool, ...props}) {
    const [opened, setOpened] = useState(false);
    const [walletAmount, setWalletAmount] = useState('-');
    const [depositedAmount, setDepositedAmount] = useState('-');
    const [valueDeposit, setValueDeposit] = useState(0);
    const [valueWithdraw, setValueWithdraw] = useState(0);
    const [tvl, setTVL] = useState(0);

    const { address: walletAddress } = walletStore(state => ({address: state.address}));

    const handleClick = () => {
        setOpened(!opened);
    }

    const handleDeposit = async () => {
        await toast.promise(
            deposit(walletAddress, pool.token, valueDeposit),
            {
                pending: 'Deposit pending',
                success: 'Deposit executed 👌',
                error: 'Deposit failed'
            }
        )
    }

    const handleWithdraw = async () => {
        await toast.promise(
            withdraw(walletAddress, pool.token, valueWithdraw),
            {
                pending: 'Withdrawal pending',
                success: 'Withdrawal executed 👌',
                error: 'Withdrawal failed'
            }
        );
    }

    useEffect(() => {
        getTVL(pool.token).then(tvl => {setTVL(web3js.utils.fromWei(tvl))});
    }, []);

    useEffect(() => {
        if (!walletAddress) {
            setWalletAmount('-');
            return;
        }

        getWalletBalance(walletAddress, pool.token).then(balance => setWalletAmount(web3js.utils.fromWei(balance)));
        getDepositedBalance(walletAddress, pool.token).then(balance => setDepositedAmount(web3js.utils.fromWei(balance)));

    }, [walletAddress]);

    return (
        <div className="Pool">
            <div className="PoolInfos" onClick={handleClick}>
                <div className="PoolColumn">
                    {pool.symbol}
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">Wallet</div>
                    <div>{walletAmount}</div>
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">Stacked</div>
                    <div>{depositedAmount}</div>
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">TVL</div>
                    <div>{tvl}</div>
                </div>
            </div>
            {opened &&
                <div className="PoolActions">
                    <Operation
                        availableAmount={walletAmount}
                        availableTitle="Wallet"
                        availableTokenName={pool.symbol}
                        actionTitle='Deposit'
                        handleClick={handleDeposit}
                        value={valueDeposit}
                        setValue={setValueDeposit}
                    />
                    <Operation
                        availableAmount={depositedAmount}
                        availableTitle="Deposited"
                        availableTokenName={pool.symbol}
                        actionTitle='Withdraw'
                        handleClick={handleWithdraw}
                        value={valueWithdraw}
                        setValue={setValueWithdraw}
                    />
                </div>
            }

        </div>
    );
}

export default Pool;