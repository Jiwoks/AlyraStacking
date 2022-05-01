import React from 'react';
import Header from "../Header/Header";
import "./Main.css";
import Pools from "./Pools/Pools";

function Main() {
    return (
        <div className="Main">
            <Header />
            <div className="Content">
                <Pools />
            </div>
        </div>
    );
}

export default Main;
