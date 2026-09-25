import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, role, allowedRole, children }) {
  if (!user) return <Navigate to="/auth" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/auth" />;
  return children;
}
