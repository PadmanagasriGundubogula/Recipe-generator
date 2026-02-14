// src/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { API_URL } from "./config";
import "./login.css"; // reuse same styles as Login

const Signup = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // backend sends { error: "message" }
        setError(data.error || "Signup failed");
      } else {
        // ✅ Success: Show message and navigate to Home automatically
        setSuccessMessage("Signup successful! Please login to continue.");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    // Similar to login success, but since it's signup page, maybe we log them in directly?
    // The backend /google-login returns a token and user object, effectively logging them in.

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    if (data.user) {
      const userId = data.user.id || data.user._id;
      if (userId) {
        localStorage.setItem("user_id", userId);
      }
    }

    if (setIsLoggedIn) setIsLoggedIn(true);

    setSuccessMessage("Google Signup successful! Logging you in...");

    setTimeout(() => {
      navigate("/page1");
    }, 2000);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // We use the same /google-login endpoint for both signup and login
        const res = await fetch(`${API_URL}/google-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Google signup failed");
        } else {
          handleGoogleSuccess(data);
        }
      } catch (err) {
        console.error(err);
        setError("Google authentication failed.");
      }
    },
    onError: () => setError("Google signup failed"),
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
          src="https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=800"
          alt="food"
          className="header-img"
        />

        <h2>Create Account ✨</h2>
        <p className="subtitle">Sign up to start creating recipes</p>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
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
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

        <footer>Made with 🥗 by Padma</footer>
      </div>
    </div>
  );
};

export default Signup;
