import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the session token so protected routes send users back to login.
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
