import PropTypes from 'prop-types';
import { createContext, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});
    const [refreshs, setRefreshs] = useState(false)
    const [persist, setPersist] = useState(JSON.parse(localStorage.getItem("persist")) || false);

    return (
        <AuthContext.Provider value={{ auth, setAuth, persist, setPersist, refreshs, setRefreshs }}>
            {children}
        </AuthContext.Provider>
    );
}

// Adding PropTypes
AuthProvider.propTypes = {
    children: PropTypes.node.isRequired, // Validate that children are provided
};

export default AuthContext;
