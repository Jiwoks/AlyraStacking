import React, {useEffect} from "react";
import Main from "./components/Main/Main";
import web3 from "./helpers/web3";
import {loadContract} from "./helpers/contract";
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  useEffect(() => {
    (async () => {
      await web3;
      await loadContract();
    })();
  }, []);
  return (
      <>
        <Main />
        <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
      </>);
}

export default App;
