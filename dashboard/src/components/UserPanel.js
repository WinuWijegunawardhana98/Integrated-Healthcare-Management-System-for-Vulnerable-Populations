import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ENV from "../data/Env";

const UserPanel = ({ username }) => {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState("/static/sample.png"); // Default avatar
  const location = useLocation(); // Get the current route

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(ENV.SERVER + `/users/${username}`);
        if (!response.ok) {
          throw new Error("User not found");
        }
        const data = await response.json();
        setUser(data.user);
        setAvatar(ENV.SERVER + data.avatar); // Set avatar URL from API response
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [username]);

  if (!user) {
    return <p style={{ textAlign: "center", fontSize: "18px" }}>Loading...</p>;
  }

  return (
    <div className="recentCustomers" style={{ padding: "20px", textAlign: "center" }}>
      {/* Avatar Section */}
      <div
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 15px",
          border: "3px solid #007bff",
        }}
      >
        <img
          src={avatar}
          alt="User Avatar"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Username and User Details */}
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px", color: "#333" }}>
        {user.username}
      </h2>
      <p style={{ fontSize: "16px", marginBottom: "10px", color: "blue" }}>
        {user.role || "Patient"}
      </p>
      <p style={{ fontSize: "18px", marginBottom: "5px", color: "#666" }}>
        {user.full_name || "No Name Provided"}
      </p>
      <p style={{ fontSize: "16px", marginBottom: "10px", color: "#666" }}>
        Contact: {user.contact || "N/A"}
      </p>
      <p style={{ fontSize: "16px", marginBottom: "10px", color: "#666" }}>
        Email: {user.email || "N/A"}
      </p>

      {/* Navigation Links */}
      {[
        { path: "/logged/profile", label: "View Profile" },
        { path: "/logged/profile/suggest-exercise", label: "Suggest Exercise" },
        { path: "/logged/profile/exercise-schedule", label: "Exercise Schedule" },
        { path: "/logged/profile/life-path", label: "Lifepath Suggestion" },
        { path: "/logged/profile/nutritions", label: "Nutrition Suggestion" },
      ].map(({ path, label }) => {
        const isActive = location.pathname === path; // Check if the link is active

        return (
          <Link
            key={path}
            to={path}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              backgroundColor: isActive ? "#fff" : "#007bff", // Active: White, Inactive: Blue
              color: isActive ? "#007bff" : "#fff", // Active: Blue font, Inactive: White font
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "bold",
              border: "2px solid #007bff", // Add border to define active selection
              transition: "background-color 0.3s, transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = isActive ? "#f0f0f0" : "#0056b3")}
            onMouseOut={(e) => (e.target.style.backgroundColor = isActive ? "#fff" : "#007bff")}
            onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
};

export default UserPanel;
