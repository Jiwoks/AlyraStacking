import React from "react";
import "./Header.css"
// import "../../index.css"

function Address(props){
	return(
		<div className="Address">
			Connected: {props.connected}
		</div>
	)
}

function Header(props){
	return(
		<div className="Header">
			<Address
				connected={props.connected}
			/>
		</div>
	)
}

export default Header;