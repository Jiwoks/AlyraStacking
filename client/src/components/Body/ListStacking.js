import React from "react";

import "./ListStacking.css"

function Vault(props){
	// console.log(props.pool);
	return (
		<div>
			List
		</div>
	)
}

function ListStacking({pools, ...props}){
	// console.log(pools);
	// pools.forEach(element => {
	// 	console.log(element);
	// });
	pools.map((key, value)=> console.log(key, value));
	return (
		<div className="ListStacking">
			{/* {pools.map(pool => {
				return <Vault pool={pool}/>
			})} */}
		</div>
	)
}

export default ListStacking;