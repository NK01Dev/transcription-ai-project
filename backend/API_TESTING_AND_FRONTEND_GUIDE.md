# API Testing & Frontend Integration Guide

This guide provides comprehensive documentation for testing the Backend API using Postman and integrating it with a React frontend.

## 🚀 Base Configuration

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Bearer Token (JWT)

---

## 🧪 Postman Testing Guide

### 1. Authentication (`/auth`)

#### Register a New User

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/register`
- **Body** (JSON):
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }
  ```
  _(Note: `role` is optional, defaults to "user". Use "admin" for admin privileges)_

#### Login

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/login`
- **Body** (JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: Copy the `token` from the response. You will need this for protected routes.

#### Get Current User Profile

- **Method**: `GET`
- **URL**: `{{baseUrl}}/auth/me`
- **Headers**:
  - `Authorization`: `Bearer <YOUR_TOKEN_HERE>`

---

### 2. Exam Results (`/results`)

#### Submit a Result

- **Method**: `POST`
- **URL**: `{{baseUrl}}/results/submit`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body** (JSON):
  ```json
  {
    "score": 85
  }
  ```

#### Get My Results

- **Method**: `GET`
- **URL**: `{{baseUrl}}/results/my`
- **Headers**: `Authorization: Bearer <TOKEN>`

#### Get All Results (Admin Only)

- **Method**: `GET`
- **URL**: `{{baseUrl}}/results`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`

---

### 3. Transcriptions (`/transcriptions`)

#### Upload Audio for Transcription

- **Method**: `POST`
- **URL**: `{{baseUrl}}/transcriptions/upload`
- **Body** (form-data):
  - `audio`: [Select File] (mp3, wav, m4a, etc.)
  - `language`: `en-US` (optional, default: en-US)

#### Check Transcription Status

- **Method**: `GET`
- **URL**: `{{baseUrl}}/transcriptions/status/:id`
- **Params**: Replace `:id` with the ID returned from the upload endpoint.

#### Get All Transcriptions

- **Method**: `GET`
- **URL**: `{{baseUrl}}/transcriptions`
- **Query Params** (Optional):
  - `page`: `1`
  - `limit`: `20`
  - `status`: `COMPLETED`

#### Delete Transcription

- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/transcriptions/:id`

---

## ⚛️ React Frontend Integration

### 1. Setup Axios Client (`src/services/api.js`)

Create a centralized Axios instance to handle the base URL and automatically attach the token.

```javascript
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Authentication Service (`src/services/auth.service.js`)

```javascript
import api from "./api";

const register = (name, email, password, role) => {
  return api.post("/auth/register", {
    name,
    email,
    password,
    role,
  });
};

const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const getMe = () => {
  return api.get("/auth/me");
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  getMe,
};

export default AuthService;
```

### 3. Result Service (`src/services/result.service.js`)

```javascript
import api from "./api";

const submitResult = (score) => {
  return api.post("/results/submit", { score });
};

const getMyResults = () => {
  return api.get("/results/my");
};

const getAllResults = () => {
  return api.get("/results");
};

const ResultService = {
  submitResult,
  getMyResults,
  getAllResults,
};

export default ResultService;
```

### 4. Transcription Service (`src/services/transcription.service.js`)

```javascript
import api from "./api";

const uploadAudio = (file, language = "en-US") => {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("language", language);

  return api.post("/transcriptions/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const checkStatus = (id) => {
  return api.get(`/transcriptions/status/${id}`);
};

const getAllTranscriptions = (page = 1, limit = 20) => {
  return api.get(`/transcriptions?page=${page}&limit=${limit}`);
};

const deleteTranscription = (id) => {
  return api.delete(`/transcriptions/${id}`);
};

const TranscriptionService = {
  uploadAudio,
  checkStatus,
  getAllTranscriptions,
  deleteTranscription,
};

export default TranscriptionService;
```

### 5. Example Usage in Component (`src/components/Dashboard.js`)

```javascript
import React, { useState, useEffect } from "react";
import ResultService from "../services/result.service";
import AuthService from "../services/auth.service";

const Dashboard = () => {
  const [results, setResults] = useState([]);
  const [score, setScore] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      fetchResults(currentUser.role);
    }
  }, []);

  const fetchResults = async (role) => {
    try {
      let response;
      if (role === "admin") {
        response = await ResultService.getAllResults();
      } else {
        response = await ResultService.getMyResults();
      }
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ResultService.submitResult(Number(score));
      setMessage("Result submitted successfully!");
      setScore("");
      fetchResults(user.role); // Refresh list
    } catch (error) {
      setMessage("Error submitting result.");
    }
  };

  if (!user) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, {user.name}</h1>
      <span className="badge">
        {user.role === "admin" ? "Administrator" : "Student"}
      </span>

      {/* User Section: Submit Score */}
      {user.role === "user" && (
        <div className="submit-section card">
          <h3>Submit New Score</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Score:</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter score (0-100)"
                min="0"
                max="100"
                required
              />
            </div>
            <button type="submit">Submit Result</button>
          </form>
          {message && (
            <p
              className={`message ${
                message.includes("Error") ? "error" : "success"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}

      {/* Results List - Different for Admin vs User */}
      <div className="results-list card">
        <h3>
          {user.role === "admin" ? "All Student Results" : "Your Past Results"}
        </h3>

        {results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {user.role === "admin" && <th>Student</th>}
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result._id}>
                  {user.role === "admin" && (
                    <td>
                      {result.user ? (
                        <>
                          {result.user.name} <br />
                          <small>{result.user.email}</small>
                        </>
                      ) : (
                        "Unknown User"
                      )}
                    </td>
                  )}
                  <td>{result.score}</td>
                  <td>
                    <span className={`status-${result.status}`}>
                      {result.status}
                    </span>
                  </td>
                  <td>{new Date(result.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
```
