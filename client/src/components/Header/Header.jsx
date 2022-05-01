import React from 'react';
import './Header.css';
import Wallet from "./Wallet";
import {ReactComponent as Title} from '../../assets/images/title.svg';

function Header() {
    return (
        <>
            <div className="Header">
                <Wallet />
            </div>
            <div className="Title">
                <Title />
            </div>
        </>
    );
}

export default Header;
