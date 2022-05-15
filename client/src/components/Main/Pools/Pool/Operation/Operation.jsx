import React, {useEffect} from 'react';
import './Operation.css';
import AmountInput from "../../../../Reusable/AmountInput/AmountInput";
import Button from "@mui/material/Button";
import walletStore from "../../../../../stores/wallet";

function Operation({availableTitle, availableAmount, availableTokenName, handleClick, actionTitle, setValue, value, ...props}) {
    const { address: walletAddress } = walletStore(state => ({address: state.address}));

    const handleClickMax = () => {
        if (availableAmount === '-') {
            return;
        }
        setValue(availableAmount);
    }

    const handleChange = (e) => {
        if (e.target.value === '') {
            setValue('');
            return;
        }

        if (!/^[0-9]+(([.,]?)[0-9]*)$/.exec(e.target.value)) {
            return
        }

        setValue(e.target.value);
    }

    const handleFocusCapture = (e) => {
        if (e.target.value === '0') {
            setValue('');
        }
    }

    return (
        <div className="Operation">
            <h2>{props.title}</h2>
            {availableTitle} {parseFloat(availableAmount).toLocaleString()} {availableTokenName}
            <AmountInput handleFocusCapture={handleFocusCapture} handleChange={handleChange} onClick={handleClickMax} value={value}/>
            <Button className="OperationButton" variant="contained" disabled={value<=0 || walletAddress === null} onClick={handleClick} >{actionTitle}</Button>
        </div>
    );
}

export default Operation;
