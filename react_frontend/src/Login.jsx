// src/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { API_URL } from "./config";
import "./login.css";

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid login credentials");
        return;
      }

      handleLoginSuccess(data);

    } catch (err) {
      console.error(err);
      setError("Something went wrong — try again.");
    }
  };

  const handleLoginSuccess = (data) => {
    // ✅ Store token
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // ✅ Store user_id (supports both `id` and `_id`)
    if (data.user) {
      const userId = data.user.id || data.user._id;
      if (userId) {
        localStorage.setItem("user_id", userId);
      }
    }

    // ✅ Update global state immediately
    if (setIsLoggedIn) setIsLoggedIn(true);

    // ✅ Show success message and navigate automatically
    setSuccessMessage("Login successful! Redirecting...");

    setTimeout(() => {
      navigate("/page1");
    }, 2000);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${API_URL}/google-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Google login failed");
        } else {
          handleLoginSuccess(data);
        }
      } catch (err) {
        console.error(err);
        setError("Google authentication failed.");
      }
    },
    onError: () => setError("Google login failed"),
  });

  return (
    <div className="container">
      {successMessage && (
        <div className="notification-popup">
          {successMessage}
        </div>
      )}
      <div className="login-card">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
          alt="food"
          className="header-img"
        />

        <h2>Welcome Back 👋</h2>
        <p className="subtitle">Login to your Recipe Creator account</p>

        {error && (
          <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn">
            Login
          </button>

          <div className="separator">OR</div>

          <button
            type="button"
            className="google-btn"
            onClick={() => googleLogin()}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              style={{ width: "20px", height: "20px" }}
            />
            Continue with Google
          </button>
        </form>

        <p className="signup-text">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>

        <footer>Made with 🥗 by Padma</footer>
      </div>
    </div>
  );
};

export default Login;
