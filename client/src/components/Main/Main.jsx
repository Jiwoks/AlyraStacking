import React, {useEffect, useState} from 'react';
import Header from "../Header/Header";
import "./Main.css";
import Pools from "./Pools/Pools";
import Fab from "@mui/material/Fab";
import AddIcon from '@mui/icons-material/Add';
import {isOwner} from "../../helpers/contract";
import walletStore from "../../stores/wallet";
import NewPool from "./Pools/NewPool/NewPool";
import {Dialog} from "@mui/material";

function Main() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [popupOpened, setPopupOpened] = useState(false)

    const { address } = walletStore(state => ({address: state.address}));

    useEffect(() => {
        isOwner(address).then((owner) => setIsAdmin(owner));
    }, [address]);

    const handleClick = () => {
        setPopupOpened(true);
    }

    const handleClosePopup = () => {
        console.log('close')
        setPopupOpened(false);
    }

    return (
        <div className="Main">
            <Header />
            <div className="Content">
                <Pools />
            </div>
            {isAdmin &&
                <Fab className="MainAddPool" color="inverse" aria-label="add" onClick={handleClick}>
                    <AddIcon />
                </Fab>
            }
            {popupOpened &&
                <Dialog
                    open={popupOpened}
                    onClose={handleClosePopup}
                >
                    <NewPool closePopup={handleClosePopup} />
                </Dialog>
            }
        </div>
    );
}

export default Main;
