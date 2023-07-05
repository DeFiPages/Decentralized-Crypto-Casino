import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom'; 
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const Tutorial = () => {
    const navigate = useNavigate(); 

    return (
        <Container>
            <Typography variant="h3" gutterBottom className="text-white">Tutorial</Typography>
            
            <Typography variant="h5" gutterBottom className="text-white h5-mt">Step 1: Connect to Metamask</Typography>
            <Typography variant="body1" className="text-white">
                Click on the red 'Connect' button on the top right corner of the header to connect to your Metamask Wallet.
            </Typography>

            <Typography variant="h5" gutterBottom className="text-white h5-mt">Step 2: Connect Metamask to Defichain Changi Testnet</Typography>
            <Typography variant="body1" className="text-white">
                After connecting to Metamask, go to your Metamask settings, select "Networks" and then "Add Network". Use the following details:
                <ul>
                    <li>Network Name: Metachain Changi</li>
                    <li>New RPC URL: https://testnet-dmc.mydefichain.com:20551</li>
                    <li>Chain ID: 1133</li>
                    <li>Currency Symbol: DFI</li>
                    <li>Block Explorer URL: https://testnet-dmc.mydefichain.com:8444</li>
                </ul>
            </Typography>

            <Typography variant="h5" gutterBottom className="text-white h5-mt">Step 3: Get Test DFI</Typography>
            <Typography variant="body1" className="text-white">
                Visit the faucet at <a href='https://mydeficha.in/en/index.php?site=faucet' className="link-white" target="_blank" rel="noopener noreferrer">https://mydeficha.in/en/index.php?site=faucet</a> and select 'DMC Faucet Testnet Changi' to receive Test DFI.
            </Typography>

            <Typography variant="h5" gutterBottom className="text-white h5-mt">Step 4: Buy Casino (CAS) Token</Typography>
            <Typography variant="body1" className="text-white">
                Now you're ready to buy CAS tokens. <Button onClick={() => navigate("/Wallet/buyTokens")} className="link-white">Go to Buy Tokens page</Button>
            </Typography>

            <Typography variant="h5" gutterBottom className="text-white h5-mt">Step 5: Play Roulette Game</Typography>
            <Typography variant="body1" className="text-white">
                Congratulations, you're all set! <Button onClick={() => navigate("/games/Roulette")} className="link-white">Play our Roulette game</Button>
            </Typography>
        </Container>
    );
};

export default Tutorial;
