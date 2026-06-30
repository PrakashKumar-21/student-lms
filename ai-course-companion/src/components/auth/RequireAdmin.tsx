import { ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAdminProfile, getAdminToken } from "@/services/adminAuth";

type RequireAdminProps = {
  children: ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  const location = useLocation();
  const token = useMemo(() => getAdminToken(), []);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      return;
    }
    let isMounted = true;
    getAdminProfile()
      .then(() => {
        if (isMounted) setIsValid(true);
      })
      .catch(() => {
        if (isMounted) setIsValid(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isValid === false) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking admin session...
      </div>
    );
  }

  return <>{children}</>;
}
