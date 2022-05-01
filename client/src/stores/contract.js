/**
 * We store here all the data related to the contract
 * Events, current state, ...
 */
import create from 'zustand';

const store = create(set => ({
    ready: false,
    address: null,
    pools: []
}));

export default store;
