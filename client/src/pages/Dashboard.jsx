
import { useNavigate } from "react-router-dom";
import ReadingForm from "../components/ReadingForm";
import ReadingList from "../components/ReadingList";
import ReportCards from "../components/ReportCards";
import { useState } from "react";
import "../dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [refresh, setRefresh] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleReadingAdded = () => {
    setRefresh((prev) => prev + 1);
  };

  return (
    <div className="dashboard-page">

      <header className="top-navbar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>Sweety</h2>
            <span>GLUCOSE CARE</span>
          </div>
        </div>

        <div className="user-section">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-details">
            <span>Welcome back,</span>
            <strong>{user.name || "User"}</strong>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">

        <section className="welcome-banner">
          <div>
            <span className="eyebrow">YOUR PERSONAL HEALTH SPACE</span>
            <h1>Hello, {user.name || "there"}! 👋</h1>
            <p>
              Stay informed, track your glucose, and take care
              of your health one day at a time.
            </p>
          </div>

          <div className="welcome-decoration">
            <span>♥</span>
            <small>Health first</small>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <span className="section-label">01 / TRACK</span>
            <h2>Record your glucose</h2>
            <p>Keep your daily readings organized in one place.</p>
          </div>

          <ReadingForm onReadingAdded={handleReadingAdded} />
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <span className="section-label">02 / HISTORY</span>
            <h2>Your reading history</h2>
            <p>Review and manage your previous readings.</p>
          </div>

          <ReadingList refresh={refresh} />
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <span className="section-label">03 / INSIGHTS</span>
            <h2>Your glucose insights</h2>
            <p>Explore daily and monthly reading summaries.</p>
          </div>

          <ReportCards refresh={refresh} />
        </section>

        <footer className="dashboard-footer">
          <strong>Sweety</strong>
          <span>Small steps towards healthier days.</span>
        </footer>

      </main>
    </div>
  );
}

export default Dashboard;
