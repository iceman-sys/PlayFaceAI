import { Navigate, useLocation } from 'react-router-dom';
import PrizeLandingPage from './PrizeLandingPage';

/** Root redirects to prize landing, preserving QR query params */
export default function Index() {
  const location = useLocation();
  return <Navigate to={`/prize${location.search}`} replace />;
}

export { PrizeLandingPage };
