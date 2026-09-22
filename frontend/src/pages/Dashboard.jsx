import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1>Welcome</h1>
        <p className="subtitle">You're logged in to ThikedarApp</p>
        <div className="user-box">
          <span>Mobile number</span>
          <strong>+91 {user?.phone}</strong>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
