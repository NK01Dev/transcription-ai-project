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

> **Note**: Transcription endpoints currently do **NOT** require authentication. No Bearer token needed.

#### Upload Audio for Transcription

- **Method**: `POST`
- **URL**: `{{baseUrl}}/transcriptions/upload`
- **Body** (form-data):
  - `audio`: [Select File] (mp3, wav, m4a, etc.)
  - `language`: `en-US` (optional, default: en-US)
- **Response**:
  ```json
  {
    "message": "Transcription job started successfully",
    "data": {
      "id": "507f1f77bcf86cd799439011",
      "jobName": "transcription-uuid-here",
      "status": "IN_PROGRESS",
      "language": "en-US"
    }
  }
  ```

#### Check Transcription Status

- **Method**: `GET`
- **URL**: `{{baseUrl}}/transcriptions/status/:id`
- **Params**: Replace `:id` with the ID returned from the upload endpoint.
- **Response**:
  ```json
  {
    "data": {
      "id": "507f1f77bcf86cd799439011",
      "jobName": "transcription-uuid-here",
      "status": "COMPLETED",
      "transcriptionText": "This is the transcribed text...",
      "language": "en-US",
      "confidence": 0.95,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:05:00.000Z",
      "metadata": {
        "fileName": "audio.mp3",
        "fileSize": 1024000,
        "mimeType": "audio/mpeg"
      }
    }
  }
  ```

#### Get All Transcriptions

- **Method**: `GET`
- **URL**: `{{baseUrl}}/transcriptions`
- **Query Params** (Optional):
  - `page`: `1`
  - `limit`: `20`
  - `status`: `COMPLETED`
- **Response**:
  ```json
  {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "jobName": "transcription-uuid-here",
        "status": "COMPLETED",
        "transcriptionText": "Transcribed text...",
        "language": "en-US",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
  ```

#### Delete Transcription

- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/transcriptions/:id`
- **Response**:
  ```json
  {
    "message": "Transcription deleted successfully",
    "data": {
      "id": "507f1f77bcf86cd799439011"
    }
  }
  ```

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

const getAllTranscriptions = (page = 1, limit = 20, status = null) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) {
    params.append("status", status);
  }

  return api.get(`/transcriptions?${params.toString()}`);
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

> **Important**: Transcription endpoints return responses wrapped in a `data` property. When using these services, access the data like this:
>
> ```javascript
> const response = await TranscriptionService.uploadAudio(file);
> const transcriptionId = response.data.data.id; // Note the double .data
> ```

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      fetchResults(currentUser.role);
    }
  }, []);

  const fetchResults = async (role) => {
    setLoading(true);
    try {
      let response;
      if (role === "admin") {
        response = await ResultService.getAllResults();
      } else {
        response = await ResultService.getMyResults();
      }
      // Results endpoints return data directly (not wrapped)
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results:", error);
      setMessage("Error loading results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const numericScore = Number(score);

      if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        setMessage("Please enter a valid score between 0 and 100.");
        setLoading(false);
        return;
      }

      await ResultService.submitResult(numericScore);
      setMessage("Result submitted successfully!");
      setScore("");
      fetchResults(user.role); // Refresh list
    } catch (error) {
      console.error("Error submitting result:", error);
      setMessage(
        error.response?.data?.message ||
          "Error submitting result. Please try again."
      );
    } finally {
      setLoading(false);
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
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Result"}
            </button>
          </form>
          {message && (
            <p
              className={`message ${
                message.includes("Error") || message.includes("valid")
                  ? "error"
                  : "success"
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

        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
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

---

## 📋 Important Notes

### Response Format Differences

The API has **two different response formats** depending on the endpoint:

#### Auth & Results Endpoints (Direct Response)
```javascript
// Response structure
{
  "_id": "...",
  "name": "...",
  "email": "...",
  // ... other fields directly in response
}

// Frontend usage
const response = await AuthService.login(email, password);
const userName = response.data.name; // Single .data
```

#### Transcription Endpoints (Wrapped Response)
```javascript
// Response structure
{
  "message": "...",
  "data": {
    "id": "...",
    "status": "...",
    // ... actual data nested inside
  }
}

// Frontend usage
const response = await TranscriptionService.uploadAudio(file);
const transcriptionId = response.data.data.id; // Double .data
```

### Authentication Requirements

| Endpoint Group | Authentication Required | Notes |
|----------------|------------------------|-------|
| `/api/auth/*` | Only `/auth/me` | Register and login are public |
| `/api/results/*` | ✅ Yes | All endpoints require Bearer token |
| `/api/transcriptions/*` | ❌ No | Currently public (no auth middleware) |

> **Security Recommendation**: Consider adding authentication to transcription endpoints in production to prevent unauthorized usage and track user activity.

### Error Handling Best Practices

Always wrap API calls in try-catch blocks and handle errors gracefully:

```javascript
try {
  const response = await SomeService.someMethod();
  // Handle success
} catch (error) {
  console.error("Error:", error);
  
  // Access backend error message
  const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       "An unexpected error occurred";
  
  // Display to user
  setMessage(errorMessage);
}
```

### CORS Configuration

Ensure your backend has CORS enabled for your frontend origin. The backend currently uses:

```javascript
app.use(cors()); // Allows all origins
```

For production, restrict to specific origins:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

### File Upload Considerations

- **Max file size**: 100MB (configured in multer)
- **Allowed formats**: mp3, wav, mp4, m4a, ogg, webm, flac
- **Content-Type**: Must be `multipart/form-data` for file uploads
- **Field name**: Audio file must be sent as `audio` field in FormData

### Pagination

Transcription endpoints support pagination:

```javascript
// Default values
const page = 1;
const limit = 20;

// Usage
const response = await TranscriptionService.getAllTranscriptions(page, limit);
const { data, pagination } = response.data;

console.log(`Showing ${data.length} of ${pagination.total} results`);
console.log(`Page ${pagination.page} of ${pagination.pages}`);
```

### Status Values

**Result Status** (auto-calculated):
- `pass`: score >= 50
- `fail`: score < 50

**Transcription Status**:
- `PENDING`: Job created but not started
- `IN_PROGRESS`: AWS Transcribe job running
- `COMPLETED`: Transcription finished successfully
- `FAILED`: Transcription failed (check `errorMessage` field)

---

## 🔧 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Token expired or invalid. Re-login to get a new token.
2. **CORS Error**: Backend CORS not configured for your frontend origin.
3. **File Upload 400 Error**: Check file type is supported and size is under 100MB.
4. **Cannot read property 'data'**: Check if you're accessing the correct response structure (wrapped vs direct).
5. **Network Error**: Ensure backend is running on `http://localhost:5000`.

### Testing Checklist

- [ ] Backend server is running (`npm start` in backend directory)
- [ ] MongoDB is connected (check server logs)
- [ ] AWS credentials are configured (for transcription features)
- [ ] CORS is enabled for your frontend origin
- [ ] Token is stored in localStorage after login
- [ ] API base URL matches your backend URL

---

**Last Updated**: 2025-11-30  
**API Version**: 1.0  
**Backend Framework**: Express.js + MongoDB + AWS Transcribe
