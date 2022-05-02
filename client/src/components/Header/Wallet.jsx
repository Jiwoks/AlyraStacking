import React, {useEffect} from 'react';
import './Wallet.css';
import Cookies from 'js-cookie';
import Button from "../Reusable/Button/Button";
import walletStore from '../../stores/wallet';
import {getAccount} from '../../helpers/account';

function Wallet() {
    const { address, connect, disconnect } = walletStore(state => ({address: state.address, connect: state.connect, disconnect: state.disconnect}));

    useEffect(() => {
       if (Cookies.get('connected')) {
            handleClick();
       }
    }, []);

    const handleClick = () => {
        if (address === null) {
            getAccount().then(address => connect(address));
            Cookies.set('connected', 1);
        } else {
            disconnect();
            Cookies.remove('connected');
        }
    }

    let textButton = 'Connect';
    if (address) {
        textButton = address.substring(0, 5) + '...' + address.substring(address.length - 3);
    }

    return (
        <div className="Wallet">
            <Button onClick={handleClick}>{textButton}</Button>
        </div>
    );
}

export default Wallet;