import React from 'react';
import './Operation.css';
import AmountInput from "../../../../Reusable/AmountInput/AmountInput";
import Button from "../../../../Reusable/Button/Button";


function Operation({availableTitle, availableAmount, availableTokenName, handleClick, actionTitle, setValue, value, ...props}) {
    const handleClickMax = () => {
        setValue(availableAmount);
    }

    const handleChange = (e) => {

        if (!/^[0-9]+(([.,]?)[0-9]*)$/.exec(e.target.value)) {
            return
        }

        setValue(e.target.value);
    }

    return (
        <div className="Operation">
            <h2>{props.title}</h2>
            {availableTitle} {availableAmount} {availableTokenName}
            <AmountInput handleChange={handleChange} onClick={handleClickMax} value={value}/>
            <Button disabled={value<=0} onClick={handleClick} className={'Button inverse'}>{actionTitle}</Button>
        </div>
    );
}

export default Operation;
