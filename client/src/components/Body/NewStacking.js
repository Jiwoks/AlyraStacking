import React, { useState } from "react";

import "./NewStacking.css"

function NewStacking(props){

	const [token, setToken] = useState();
	const [amount, setAmount] = useState();

	const deposit = (e) => {
		e.preventDefault();
		props.deposit(token, amount);
		setToken("");
		setAmount("");
	}

	return (
		<div className="NewStacking">
				<input type="text" placeholder="Token address" value={token} onChange={e => setToken(e.target.value)}/>
				<input type="text" placeholder="amount" value={amount} onChange={e => setAmount(e.target.value)}/>
				<button onClick={deposit}>Deposit</button>
		</div>
	)
}

export default NewStacking;