import React, {useEffect, useState} from 'react';
import Button from "@mui/material/Button";
import './Claim.css';
import {claim, deposit} from "../../../../../helpers/contract";
import walletStore from "../../../../../stores/wallet";
import {toast} from "react-toastify";

function Claim({pool, claimable, ...props}) {

    const { address: walletAddress } = walletStore(state => ({address: state.address}));

    const handleClick = async () => {
        await toast.promise(
            claim(walletAddress, pool.token),
            {
                pending: 'Deposit pending',
                success: 'Deposit executed 👌',
                error: 'Deposit failed'
            }
        );
    }

    let title = 'Claim';
    if (claimable) {
        title += ' ' + claimable + ' CCT';
    }

    return (
        <div className="Claim">
            <Button className="ClaimButton" variant="contained" disabled={claimable <= 0} onClick={handleClick} >{title}</Button>
        </div>
    );
}

export default Claim;
