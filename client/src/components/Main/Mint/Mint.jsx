import React, {useEffect, useState} from 'react';
import "./Mint.css";
import LoadingButton from "@mui/lab/LoadingButton";
import contractStore from "../../../stores/contract";
import {Alert, MenuItem, Select} from "@mui/material";
import {toast} from "react-toastify";
import {mint} from "../../../helpers/mint";

function Mint({closePopup}) {
    const { pools } = contractStore(state => ({pools: state.pools}));

    const [selected, setSelected] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isMintable = async (token) => {
        try {
            await mint(token, true);
            setError('');
        } catch (e) {
            const json = /(\{.*\})$/s.exec(e.message);

            try {
                setError(JSON.parse(json[1]).message.slice(49));
            } catch (e) {
                setError(e.message);
            }
        }
    }

    const handleChange = async (e) => {
        setSelected(e.target.value);
        await isMintable(e.target.value);
    }

    useEffect(() => {
        if (selected !== '') {
            return;
        }
        if (pools.length) {
            setSelected(pools[0].token);
            isMintable(pools[0].token);
        }
    }, [pools]);

    const handleSubmit = async () => {
        setSaving(true);
        const p = toast.promise(
            mint(selected, false),
            {
                pending: 'Sending token ...',
                success: 'Token sent to your address 👌',
                error: 'Failed to send token'
            }
        );
        p.catch((e) => {
            setError(e.message);
            setSaving(false);
        });
        p.then(closePopup)
    }

    return (
        <div className="Mint">
            <h2 className="MintTitle">Get token from faucet</h2>
            {error !== '' && <Alert className="MintError" severity="warning">{error}</Alert>}
            <div>
                <Select
                    className="MintSelect"
                    value={selected}
                    label="Token to mint"
                    onChange={handleChange}
                >
                    {pools.map((pool) => {
                        return <MenuItem key={pool.token} value={pool.token}>{pool.symbol}</MenuItem>
                    })}
                </Select>
            </div>
            <div>
                <LoadingButton disabled={selected==='' || error !== ''}
                               onClick={handleSubmit}
                               className="MintButton"
                               variant="contained"
                               loading={saving}
                               loadingPosition="center">
                    Get token
                </LoadingButton>
            </div>
        </div>
    )
}

export default Mint;
