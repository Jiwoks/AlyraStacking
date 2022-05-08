import React, {useEffect, useState} from 'react';
import './NewPool.css';
import {TextField} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import web3js from "web3";
import walletStore from "../../../../stores/wallet";
import {createPool, deposit} from "../../../../helpers/contract";
import {toast} from 'react-toastify';

function NewPool({closePopup}) {
    const [contract, setContract] = useState('');
    const [oracle, setOracle] = useState('');
    const [rewards, setRewards] = useState('');
    const [symbol, setSymbol] = useState('');
    const [submitEnabled, setSubmitEnabled] = useState(false);
    const [saving, setSaving] = useState(false);

    const { address: walletAddress } = walletStore(state => ({address: state.address}));

    useEffect(() => {
        if(
            web3js.utils.isAddress(contract) &&
            web3js.utils.isAddress(oracle) &&
            symbol !== ""
        )
        {
            setSubmitEnabled(true);
        } else {
            setSubmitEnabled(false);
        }
    }, [contract, oracle, rewards, symbol]);

    const handleInputChange = (input, e) => {
        if (input === 'contract') {
            setContract(e.target.value);
        } else if  (input === 'oracle') {
            setOracle(e.target.value);
        } else if  (input === 'rewards') {
            setRewards(e.target.value);
        } else if  (input === 'symbol') {
            setSymbol(e.target.value);
        }
    }

    const handleSubmit = async () => {
        // todo: verify that passed values are actual real contracts
        setSaving(true);
        toast.promise(
            createPool(walletAddress, contract, oracle, rewards, symbol),
            {
                pending: 'Pool creation pending',
                success: 'Pool created executed 👌',
                error: 'Failed to create pool'
            }
        ).finally(closePopup);
    }

    return (
        <div className="NewPool">
            <h2 className="NewPoolTitle">Add new pool</h2>
            <div>
                <TextField value={contract} onChange={(e) => handleInputChange('contract', e)} label="Token contract address" variant="outlined" placeholder="0x0" margin="normal" fullWidth/>
            </div>
            <div>
                <TextField value={oracle} onChange={(e) => handleInputChange('oracle', e)} label="Oracle contract address" variant="outlined" placeholder="0x0" margin="normal" fullWidth/>
            </div>
            <div>
                <TextField value={rewards} onChange={(e) => handleInputChange('rewards', e)} label="Rewards per seconds" variant="outlined" margin="normal" fullWidth/>
            </div>
            <div>
                <TextField value={symbol} onChange={(e) => handleInputChange('symbol', e)} label="Token Symbol" variant="outlined" margin="normal" fullWidth/>
            </div>
            <div>
                <LoadingButton disabled={!submitEnabled} onClick={handleSubmit} className="NewPoolButton" variant="contained" loading={saving} loadingPosition="center">Add pool</LoadingButton>
            </div>
        </div>
    );
}

export default NewPool;
