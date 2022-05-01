import React from 'react';
import './Pools.css';
import contractStore from '../../../stores/contract';
import Pool from "./Pool/Pool";

function Pools() {
    const { pools } = contractStore(state => ({pools: state.pools}));

    return (
        <div className="Pools">
            {pools.map((pool, index) => {
                return (
                    <Pool key={index} pool={pool} />
                )
            })}
        </div>
    );
}

export default Pools;
