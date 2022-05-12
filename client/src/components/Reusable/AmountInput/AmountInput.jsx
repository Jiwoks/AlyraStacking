import React from 'react';
import './AmountInput.css';

function AmountInput({handleChange, handleFocusCapture, value, onClick, ...props}) {
    return (
        <div className="AmountInput">
            <input onFocusCapture={handleFocusCapture} onChange={handleChange} className="Input" {...props} value={value} />
            <button onClick={onClick}>MAX</button>
        </div>
    );
}

export default AmountInput;
