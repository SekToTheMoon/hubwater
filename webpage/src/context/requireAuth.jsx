import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuth = ({ allowedPermission }) => {
  const { auth } = useAuth();
  const location = useLocation();
  console.log(auth?.posit_permission[12]);
  console.log(
    typeof auth?.posit_permission + " from requireAuth auth.position_permission"
  );

  return auth?.posit_permission[allowedPermission] == 1 ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export default RequireAuth;
