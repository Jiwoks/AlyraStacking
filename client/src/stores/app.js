/**
 * We store here all data related to the overall application
 */
import create from 'zustand';

const store = create(set => ({
    error: null,
}));

export default store;
