import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import useAuth from '../contexts/useAth.contexts';
import { AuthRoutes, PagesRoutes } from '../../../constants/routes.constant';
import Spinner from '../../../components/spinner/spinners.spinners';
import useRefreshToken from '../instance/refreshtoken.instance';


const PrivateRoute = ({ element, allowedRoles }) => {
  const { auth } = useAuth();
  // Redirect to Sign In if not authenticated
  const refresh = useRefreshToken();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();  // Capture the current location

  useEffect(() => {
    const verifyRefreshToken = async () => {
      try {
        await refresh();
      } catch (error) {
        console.error(error)
      }
      finally {
        setIsLoading(false);
      }
    }
    !auth?.accessToken ? verifyRefreshToken() : setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  ;

  if (isLoading) {
    return <Spinner isLoading={true} />;
  }

  if (!auth.accessToken) {
    return <Navigate to={AuthRoutes.signIn} />;
  }

  // Redirect to Unauthorized if role doesn't match
  if (!allowedRoles.includes(auth?.role)) {
    return <Navigate to={PagesRoutes.errorPages.Error403} state={{ from: location }} />;
  }

  // Render the component if authenticated and role matches
  return element;
};

// Define PropTypes for the component
PrivateRoute.propTypes = {
  element: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default PrivateRoute;
