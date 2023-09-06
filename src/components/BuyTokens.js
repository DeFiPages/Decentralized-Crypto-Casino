import React, { useState, useEffect } from "react";
import { Button, Grid, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useField } from "../hooks/useField";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import contractsService from "../services/contractsService";
import { loadBalance } from "../reducers/balanceReducer";
import { CustomTextField } from "./customTextField";
import TotalBNB from "./TotalBNB";
import CustomButton from "./CustomButton";

const Buy = async (event, tokenAmount, change, account, dispatch, contractRate) => {
  event.preventDefault();

  if (tokenAmount === "") {
    toast.error(`Please select an amount of tokens to buy`, {
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

  // Calculate the required DUSD for the desired amount of CAS
  const dusdAmount = tokenAmount / contractRate;

  // Check DUSD balance
  try {
    const dusdBalance = await contractsService.getDUSDBalance(account);
    console.log("User's DUSD Balance:", dusdBalance);
    if (dusdBalance < dusdAmount) {
      toast.error(`You don't have enough DUSD to buy the desired amount of tokens.`, {
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

    // If balance is sufficient, proceed with the purchase
    change(0);
    console.log(`BuyTokens.js:buy dusdAmount ${dusdAmount}`);
    await contractsService.buyTokens(dusdAmount);
    await dispatch(loadBalance(account));

    toast.success(`You have bought ${tokenAmount} tokens for ${dusdAmount} DUSD`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  } catch (error) {
    console.error("Error while buying tokens:", error); // Log the exact error for debugging purposes
    // Check if the error message contains the Ethereum error message structure
    if (error.data && error.data.message) {
      toast.error(`Transaction failed: ${error.data.message}`);
    } else {
      toast.error(`Transaction failed: ${error.message}`);
    }
  }
};

const BuyTokens = ({ account, price }) => {
  const dispatch = useDispatch();
  const tokenAmount = useField("");

  // State to hold the rate fetched from the smart contract
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
  }, [account]); // This effect runs whenever the account changes

  // Check if account is set and contractRate has been fetched
  if (!account || contractRate === null) {
    return <div>Loading...</div>;
  }
  return (
    <Grid container rowSpacing={2}>
      <Grid item xs={12}>
        <Grid container alignItems="center" justifyContent="center">
          <Typography variant="h3" sx={{ color: "#FFFFFF", width: "90%" }} align="center">
            Tokens Store
          </Typography>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <form onSubmit={(event) => Buy(event, tokenAmount.value, tokenAmount.change, account, dispatch, contractRate)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Grid container alignItems="center" justifyContent="center">
                <CustomButton display={"10"} functionallity={() => tokenAmount.change(parseInt(10))} width={"20%"} size={"large"} backGround={"#2e7d32"} text={"#e0e5bc"} margin={0.5} />
                <CustomButton display={"100"} functionallity={() => tokenAmount.change(parseInt(100))} width={"20%"} size={"large"} backGround={"#2e7d32"} text={"#e0e5bc"} margin={0.5} />
                <CustomButton display={"1000"} functionallity={() => tokenAmount.change(parseInt(1000))} width={"20%"} size={"large"} backGround={"#2e7d32"} text={"#e0e5bc"} margin={0.5} />
                <CustomButton display={"10000"} functionallity={() => tokenAmount.change(parseInt(10000))} width={"20%"} size={"large"} backGround={"#2e7d32"} text={"#e0e5bc"} margin={0.5} />
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ m: 0.25 }}>
              <Grid container alignItems="center" justifyContent="center">
                <CustomTextField
                  key={"hola"}
                  size="normal"
                  id="outlined-number"
                  label="Amount of Tokens"
                  type="number"
                  color="secondary"
                  value={tokenAmount.value}
                  InputProps={{ inputProps: { min: 1 } }}
                  onChange={tokenAmount.onChange}
                  InputLabelProps={{
                    style: {
                      color: "white",
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ m: 0.25 }}>
              {/* <TotalBNB tokenAmount={tokenAmount.value} price={price} msg={'Cost :'}/> */}
              <TotalBNB tokenAmount={tokenAmount.value} price={contractRate} msg={"Cost :"} /> {/* Using contractRate here */}
            </Grid>

            <Grid item xs={12} sx={{ m: 0.25 }}>
              <Grid container alignItems="center" justifyContent="center" spacing={2}>
                <Button type="submit" size="large" variant="contained" color="warning">
                  Buy
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
export default BuyTokens;
