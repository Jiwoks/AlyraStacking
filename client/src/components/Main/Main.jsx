import React, {useEffect, useState} from 'react';
import Header from "../Header/Header";
import "./Main.css";
import Pools from "./Pools/Pools";
import Fab from "@mui/material/Fab";
import AddIcon from '@mui/icons-material/Add';
import AddCardIcon from '@mui/icons-material/AddCard';
import {isOwner} from "../../helpers/contract";
import walletStore from "../../stores/wallet";
import NewPool from "./Pools/NewPool/NewPool";
import {Dialog} from "@mui/material";
import Mint from "./Mint/Mint";

function Main() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [popupOpened, setPopupOpened] = useState('')

    const { address } = walletStore(state => ({address: state.address}));

    useEffect(() => {
        isOwner(address).then((owner) => setIsAdmin(owner));
    }, [address]);

    const handleClickAddPool = () => {
        setPopupOpened('addPool');
    }

    const handleClosePopup = () => {
        setPopupOpened('');
    }

    const handleClickMint = () => {
        setPopupOpened('mint');
    }

    return (
        <div className="Main">
            <Header />
            <div className="Content">
                <Pools />
            </div>
            {isAdmin &&
                <Fab className="MainAddPool" color="inverse" aria-label="add" onClick={handleClickAddPool}>
                    <AddIcon />
                </Fab>
            }
            <Fab className="MainMint" color="inverse" aria-label="add" onClick={handleClickMint}>
                <AddCardIcon />
            </Fab>

            {popupOpened !== '' &&
                <Dialog
                    open={popupOpened !== ''}
                    onClose={handleClosePopup}
                >
                    {popupOpened === 'addPool' && <NewPool closePopup={handleClosePopup} /> }
                    {popupOpened === 'mint' && <Mint closePopup={handleClosePopup} /> }
                </Dialog>
            }
        </div>
    );
}

export default Main;
