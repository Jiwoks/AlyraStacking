import React, {useEffect} from "react";
import Main from "./components/Main/Main";
import web3 from "./helpers/web3";
import {loadContract} from "./helpers/contract";
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: "#027a80",
            light: "#dff6f7"
        },
        inverse: {
            main: "#fff",
            light: "#dff6f7",
            contrastText: "#027a80"
        }
    },
    components: {
        MuiButtonBase: {
            defaultProps: {
                variant: "contained"
            },
        },
    }
});

function App() {
  useEffect(() => {
    (async () => {
      await web3;
      await loadContract();
    })();
  }, []);
  return (
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>);
}

export default App;
