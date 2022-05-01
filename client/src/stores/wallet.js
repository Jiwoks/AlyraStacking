/**
 * We store here all data related to the wallet and web3 connection
 */
import create from 'zustand';

const store = create(set => ({
    ready: false, // True when web3 provider is ready
    connected: false,
    address: null,
    setWeb3: (web3) => set({web3}),
    connect: (address) => set(state => ({ connected: true, address })),
    disconnect: () => set({ connected: false, address: null, isOwner: false}),
}));

export default store;
