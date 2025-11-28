# API

A RESTful API backend for managing research papers, venues, authors, and reviews. Built with Express.js and raw SQL queries (no ORM).

## Features

- Raw SQL queries (no ORM) - compliant with course requirements
- 5 core endpoints for papers, venues, authors, and reviewers
- MySQL connection pooling for efficient database access
- CORS enabled for frontend integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=cs411
PORT=4000
```

3. Start the server:
```bash
npm start
```

The API will run at `http://localhost:4000`

## API Endpoints

### Health Check
- `GET /api/health` - Check database connection

### Papers
- `GET /api/papers` - Get latest 20 papers with venue info
- `GET /api/papers?search=term` - Search papers by title or abstract
- `GET /api/papers/:paper_id` - Get paper detail with review stats

### Venues
- `GET /api/venues/recent?sinceYear=2018` - Get venues with published papers since a year

### Authors
- `GET /api/authors/:user_id/portfolio?since=2018-01-01` - Get author's papers with review counts

### Reviewers
- `GET /api/reviewers/top?from=2024-02-15&to=2024-05-15` - Get top reviewers in a date range

## Testing

Quick test commands:

```bash
# Health check
curl http://localhost:4000/api/health

# Search papers
curl "http://localhost:4000/api/papers?search=index"

# Get paper detail
curl http://localhost:4000/api/papers/P001

# Recent venues
curl "http://localhost:4000/api/venues/recent?sinceYear=2018"

# Author portfolio
curl "http://localhost:4000/api/authors/U001/portfolio?since=2018-01-01"

# Top reviewers
curl "http://localhost:4000/api/reviewers/top?from=2024-02-15&to=2024-05-15"
```

## Database Schema

The API expects the following tables:
- `Papers` - Research papers
- `Venues` - Publication venues
- `Users` - User accounts
- `Authorship` - Paper-author relationships
- `Reviews` - Paper reviews
- `Projects` - Research projects

## Deployment

For local development, use the `.env` file. For production (GCP Cloud SQL), update the environment variables to point to your Cloud SQL instance.

## License

Project for CS 411 Database Systems, Fall 2025.

