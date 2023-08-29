import React, { useState, useEffect } from "react";
import { Button, Grid, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useField } from "../hooks/useField";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import contractsService from '../services/contractsService';
import { loadBalance } from "../reducers/balanceReducer";
import TotalBNB from "./TotalBNB";
import SelectAmount from "./SelectAmount";

const Withdraw = async (event, tokenAmount, change, account, dispatch, contractRate) => {
  event.preventDefault();
  if (tokenAmount === "") {
    toast.error(`Please select an amount of tokens to withdraw`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    return;
  }


  try {
    const casBalance = await contractsService.tokenBalance(account);
    console.log("User's CAS Balance:", casBalance);
    if (casBalance < tokenAmount) {
      toast.error(`You don't have enough CAS to withdraw.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    await contractsService.withdrawTokens(tokenAmount)
    await dispatch(loadBalance(account));

    toast.success(`You have withdrawn ${tokenAmount} tokens`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  } catch (error) {
    console.error("Error while withdraw tokens:", error); // Log the exact error for debugging purposes
    // Check if the error message contains the Ethereum error message structure
    if (error.data && error.data.message) {
      toast.error(`Transaction failed: ${error.data.message}`);
    } else {
      toast.error(`Transaction failed: ${error.message}`);
    }
  }
};


const WithdrawTokens = ({ account, balance }) => {

  const dispatch = useDispatch();
  const tokenAmount = useField("");

  const [contractRate, setContractRate] = useState(100); // default rate, but you can change this

  useEffect(() => {
    // This function fetches the rate from the smart contract
    const fetchRateFromContract = async () => {
      try {
        const fetchedRate = await contractsService.getRate();
        setContractRate(fetchedRate);
      } catch (error) {
        console.error("Error fetching rate:", error);
      }
    };

    // Only fetch the rate if the account has been connected
    if (account !== "") {
      fetchRateFromContract();
    }

  }, [account]);  // This effect runs whenever the account changes

  const auxChange = (amount) => {
    if (amount > balance) {
      toast.warn(
        `The amount of tokens to bet can't be higher than your balance`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      tokenAmount.change(balance);
    } else {
      tokenAmount.change(amount);
    }
  };

  return (
    <Grid container rowSpacing={2}>
      <Grid item xs={12}>
        <Grid container alignItems="center" justifyContent="center">
          <Typography variant="h3" sx={{ color: '#FFFFFF', width: '90%' }} align='center'>Withdraw Tokens</Typography>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <form onSubmit={(event) => Withdraw(event, tokenAmount.value, tokenAmount.change, account, dispatch, contractRate)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Grid container alignItems="center" justifyContent="center">
                <SelectAmount onChangeValue={tokenAmount.onChange} changeValue={auxChange} TextFielValue={tokenAmount.value} maxValue={balance} buttonColor={'#2e7d32'} />
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ m: 0.25 }}>
              {/* <TotalBNB tokenAmount={tokenAmount.value} price={price} msg={'You will receive'}/> */}
              <TotalBNB tokenAmount={tokenAmount.value} price={contractRate} msg={'You will receive'} />
            </Grid>

            <Grid item xs={12} sx={{ m: 0.25 }}>
              <Grid container alignItems="center" justifyContent="center" spacing={2}>
                <Button type="submit" size="large" variant="contained" color="warning">
                  Withdraw
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </Grid>
      <ToastContainer />
    </Grid>
  );
};
export default WithdrawTokens;