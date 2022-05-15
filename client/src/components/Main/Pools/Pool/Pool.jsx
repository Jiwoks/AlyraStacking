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
    getRewardTokenInfo,
    getDataFeed,
} from "../../../../helpers/contract";
import Operation from "./Operation/Operation";
import web3js from "web3";
import {toast} from 'react-toastify';
import {addToMetamask} from "../../../../helpers/account";
import {ReactComponent as MetamaskIcon} from "../../../../assets/images/metamask.svg"
import {ReactComponent as ArrowUp} from "../../../../assets/images/arrow_up.svg"
import {ReactComponent as ArrowDown} from "../../../../assets/images/arrow_down.svg"
import Claim from "./Claim/Claim";

function Pool({pool, ...props}) {
    const [opened, setOpened] = useState(false);
    const [walletAmount, setWalletAmount] = useState('-');
    const [depositedAmount, setDepositedAmount] = useState('-');
    const [valueDeposit, setValueDeposit] = useState(0);
    const [valueWithdraw, setValueWithdraw] = useState(0);
    const [valueClaimable, setValueClaimable] = useState(0);
    const [tvl, setTVL] = useState(0);
    const [rewardToken, setRewardToken] = useState(null);
    const [dataFeed, setDataFeed] = useState(null);

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
        getDataFeed(pool['token']).then(dataFeed => setDataFeed(dataFeed));
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
            setValueClaimable(0);
            return;
        }

        updatePool();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletAddress]);

    /**
     * Update regularly the value of claimable rewards
     */
    useEffect(() => {
        if (!walletAddress) {
            return;
        }

        const interval = setInterval(() => {
            claimableRewards(walletAddress, pool.token).then(rewards => setValueClaimable(web3js.utils.fromWei(rewards)));
            getDataFeed(pool['token']).then(dataFeed => setDataFeed(dataFeed));
        }, 4000);
        return () => {
            clearInterval(interval);
        }
    }, [depositedAmount, walletAddress]);

    /**
     * Generate ETH conversion display depending on passed value
     *
     * @param value
     * @return {string|boolean}
     */
    const calValue = (value) => {
        if (!dataFeed) {
            return false;
        }

        if (!parseFloat(value)) {
            return false;
        }

        const convertedValue = new web3js.utils.BN(dataFeed.price).mul(new web3js.utils.BN(parseFloat(value))).div(new web3js.utils.BN(Math.pow(10, parseInt(dataFeed.decimals))))

        return '$' + parseFloat(convertedValue).toLocaleString();
    }

    let claimable = valueClaimable;
    if (typeof valueClaimable === 'string') {
        claimable = parseFloat(claimable);
    }
    if (claimable > 0) {
        claimable = claimable.toFixed(2);
    }

    return (
        <div className="Pool">
            <div className="PoolInfos" onClick={handleClick}>
                <div className="PoolColumn">
                    {pool.symbol}
                    <a className="MetamaskIcon" onClick={(e) => addToMetamask(e, pool.token, pool.symbol)} title={"Add " + pool.symbol + " to metamask"}><MetamaskIcon width={18} /></a>
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">Wallet</div>
                    <div>{parseFloat(walletAmount).toLocaleString()}</div>
                    {calValue(walletAmount) !== false && <div>({calValue(walletAmount)})</div>}
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">Stacked</div>
                    <div>{parseFloat(depositedAmount).toLocaleString()}</div>
                    {calValue(depositedAmount) !== false && <div>({calValue(depositedAmount)})</div>}
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">TVL</div>
                    <div>{parseFloat(tvl).toLocaleString()}</div>
                    {calValue(tvl) !== false && <div>({calValue(tvl)})</div>}
                </div>
                <div className="PoolColumn">
                    <div className="PoolColumnTitle">Pending Rewards</div>
                    <div>
                        {rewardToken !== null &&
                            <>
                                {claimable} {rewardToken.symbol}
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
                    <Claim claimable={claimable} pool={pool} />
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
