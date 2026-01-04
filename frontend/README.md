# CS 411 Frontend - Papers Management System

## Overview

This is the frontend React application for the CS 411 Papers Management System. It provides a user-friendly interface for searching papers, viewing all papers, and running advanced database queries.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| Routing | React Router DOM v6 |
| Styling | CSS3 (Modern CSS with Flexbox/Grid) |
| HTTP Client | Fetch API |

## Project Structure

```
cs_411_frontend/
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx          # Entry point
│   ├── App.jsx           # Main app component with routing
│   ├── App.css
│   ├── index.css         # Global styles
│   ├── config.js         # API configuration
│   └── pages/
│       ├── Login.jsx     # Login page
│       ├── Login.css
│       ├── Home.jsx      # Home page with all features
│       └── Home.css
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd cs_411_frontend
npm install
```

### Configuration

1. Create a `.env` file (optional) or update `src/config.js`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Or for production:
```env
VITE_API_BASE_URL=https://your-backend.vercel.app
```

### Running the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

### 1. User Authentication
- Login page with username/password
- Session management using localStorage
- Protected routes

### 2. Search Papers
- Search by title or abstract
- Real-time search results

### 3. View All Papers
- Display latest 20 papers
- Paper cards with metadata
- Venue and status information

### 4. Advanced Queries

#### Query 1: User Papers by Year
- Get papers authored by a user
- Filter by year (upload_timestamp >= year-01-01)
- Sorted by upload_timestamp DESC, review_count DESC
- Limit 15 results

#### Query 2: Venues by Year
- Get venues with published papers
- Filter by year >= specified year
- Sorted by year DESC, total_papers DESC
- Limit 15 results

#### Query 3: Top Reviewers
- Get top reviewers in a date range
- Shows review counts and papers reviewed
- Sorted by total_reviews_received DESC
- Limit 15 results

#### Query 4: User Paper Reviews
- Get papers authored by a user with review counts
- Sorted by review_count DESC, last_review_at DESC
- Limit 15 results

## API Integration

The frontend communicates with the backend API at the URL specified in `src/config.js`.

### Required Backend Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/papers` - Get all papers
- `GET /api/papers?search=term` - Search papers
- `GET /api/advanced/query1?year=2024&user_id=U005` - Query 1
- `GET /api/advanced/query2?year=2020` - Query 2
- `GET /api/advanced/query3?start_date=2024-02-15&end_date=2024-05-15` - Query 3
- `GET /api/advanced/query4?user_id=U010` - Query 4

## UI/UX Features

- Modern gradient design
- Responsive layout
- Tab-based navigation
- Loading states
- Error handling
- Empty state messages
- Hover effects and animations

## Notes

- Authentication tokens are stored in localStorage (for demo purposes)
- In production, consider using secure HTTP-only cookies or JWT tokens
- CORS is enabled on backend endpoints for development
- The app assumes the backend is running and accessible

## Integration with Backend

This frontend is designed to work with the `cs_411_backend` project. Make sure:

1. Backend is deployed/running
2. API_BASE_URL in `src/config.js` points to your backend
3. Database has the required tables (Users, Papers, Venues, Authorship, Reviews, Projects)

## License

Project for CS 411 Database Systems, Fall 2025.

