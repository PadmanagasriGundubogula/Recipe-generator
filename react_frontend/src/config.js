const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:2000";
  } else {
    // Placeholder for production URL. User must update this after backend deployment.
    // Example: "https://my-recipe-app-backend.onrender.com"
    return "https://recipe-backend-padma.onrender.com";
  }
};

export const API_URL = getApiUrl();
