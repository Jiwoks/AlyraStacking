import React, {useEffect, useState} from 'react';
import './Pool.css';
import walletStore from "../../../../stores/wallet";
import {
    deposit,
    withdraw,
    getWalletBalance,
    getDepositedBalance,
    getTVL,
    claimableRewards,
    getRewardTokenInfo
} from "../../../../helpers/contract";
import Operation from "./Operation/Operation";
import web3js from "web3";
import {toast} from 'react-toastify';
import {addToMetamask} from "../../../../helpers/account";
import {ReactComponent as MetamaskIcon} from "../../../../assets/images/metamask.svg"
import {ReactComponent as ArrowUp} from "../../../../assets/images/arrow_up.svg"
import {ReactComponent as ArrowDown} from "../../../../assets/images/arrow_down.svg"

function Pool({pool, ...props}) {
    const [opened, setOpened] = useState(false);
    const [walletAmount, setWalletAmount] = useState('-');
    const [depositedAmount, setDepositedAmount] = useState('-');
    const [valueDeposit, setValueDeposit] = useState(0);
    const [valueWithdraw, setValueWithdraw] = useState(0);
    const [valueClaimable, setValueClaimable] = useState(0);
    const [tvl, setTVL] = useState(0);
    const [rewardToken, setRewardToken] = useState(null);

    const { address: walletAddress } = walletStore(state => ({address: state.address}));

    const handleClick = () => {
        setOpened(!opened);
    }

    const handleDeposit = async () => {
        setValueDeposit(0);
        await toast.promise(
            deposit(walletAddress, pool.token, valueDeposit),
            {
                pending: 'Deposit pending',
                success: 'Deposit executed 👌',
                error: 'Deposit failed'
            }
        );
        await updatePool();
    }

    const handleWithdraw = async () => {
        setValueWithdraw(0);
        await toast.promise(
            withdraw(walletAddress, pool.token, valueWithdraw),
            {
                pending: 'Withdrawal pending',
                success: 'Withdrawal executed 👌',
                error: 'Withdrawal failed'
            }
        );
        await updatePool();
    }

    const updatePool = async () => {
        getWalletBalance(walletAddress, pool.token).then(balance => setWalletAmount(web3js.utils.fromWei(balance)));
        getDepositedBalance(walletAddress, pool.token).then(balance => setDepositedAmount(web3js.utils.fromWei(balance)));
        claimableRewards(walletAddress, pool.token).then(rewards => setValueClaimable(web3js.utils.fromWei(rewards)));
        getTVL(pool.token).then(tvl => setTVL(web3js.utils.fromWei(tvl)));
    }

    useEffect(() => {
        getTVL(pool.token).then(tvl => {setTVL(web3js.utils.fromWei(tvl))});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Get Reward token information
     */
    useEffect(() => {
        (async () => {
            setRewardToken(await getRewardTokenInfo());
        })()
    }, []);

    useEffect(() => {
        if (!walletAddress) {
            setWalletAmount('-');
            setDepositedAmount('-');
            return;
        }

        updatePool();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletAddress]);

    /**
     * Update regularly the value of claimable rewards
     */
    useEffect(() => {
        const interval = setInterval(() => {
            if (depositedAmount > 0) {
                claimableRewards(walletAddress, pool.token).then(rewards => setValueClaimable(web3js.utils.fromWei(rewards)));
            }



        }, 4000);
        return () => {
            clearInterval(interval);
        }
    }, []);

    return (
        <div className="Pool">
            <div className="PoolInfos" onClick={handleClick}>
                <div className="PoolColumn">
                    {pool.symbol}
                    <a className="MetamaskIcon" onClick={(e) => addToMetamask(e, pool.token, pool.symbol)} title={"Add " + pool.symbol + " to metamask"}><MetamaskIcon width={18} /></a>
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
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">Pending Rewards</div>
                    <div>
                        {rewardToken !== null &&
                            <>
                                {valueClaimable} {rewardToken.symbol}
                                <a className="MetamaskIcon" onClick={(e) => addToMetamask(e, rewardToken.address, rewardToken.symbol)} title={"Add " + rewardToken.symbol + " to metamask"}><MetamaskIcon width={18} /></a>
                            </>
                        }
                    </div>
                </div>
                <div className="UpDownArrow">
                    {opened && <ArrowUp />}
                    {!opened && <ArrowDown />}
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
