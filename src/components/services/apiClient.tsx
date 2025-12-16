import axios from "axios";
import { API_BASE_URL } from "../../constants/Api";

const TOKEN_KEY = "authToken";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
    },
});

/* =======================
   Request Interceptor
======================= */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (process.env.NODE_ENV === "development") {
      console.log("=== API Request ===");
      console.log("URL:", `${config.baseURL}${config.url}`);
    }

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Request interceptor error:", error);
    }
    return Promise.reject(error);
  }
);

/* =======================
   Response Interceptor
======================= */
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("=== API Response ===", response.status);
    }
    return response;
  },
  (error) => {
    //  Network / server down
    if (!error.response) {
      console.error("Network error or server not reachable");
      return Promise.reject({
        message: "Server not reachable. Please try again later.",
      });
    }

    const { status } = error.response;

    //  Unauthorized
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("user");

      // SPA-friendly redirect
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;