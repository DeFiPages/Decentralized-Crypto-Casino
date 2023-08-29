import { Grid, Typography, Avatar } from "@mui/material";
import bnb from "../images/dusd.svg";

const TotalBNB = ({ tokenAmount, price, msg }) => {
    const computedPrice = tokenAmount / price;  // This calculates the DUSD cost

    if (tokenAmount > 0 && tokenAmount !== "") {
        return (
            <Grid container justifyContent="center" alignItems="center">
                <Typography sx={{ color: '#FFFFFF' }}>
                    {msg} {computedPrice} DUSD 
                </Typography>
                <Avatar
                    alt=""
                    src={bnb}
                    sx={{ width: 24, height: 24, marginLeft: 1 }}
                />
            </Grid>
        )
    }
    return null;  // Return null if the conditions aren't met, so React knows not to render anything
}

export default TotalBNB;
