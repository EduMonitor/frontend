import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

import useCurrentUser from "../../utils/hooks/current/user.currents"

const Dashboard =()=>{
    const {currentUser}=useCurrentUser();
    
    return (
        <>
        <Box>{currentUser && 
            (<Typography >{currentUser.firstName}</Typography>)
            }</Box>
        </>
    )
}

export default Dashboard