# Family Financial App

## Overview

The Family Financial App is a web application built using Next.js, Tailwind CSS, and FastAPI. It enables families to track and manage their finances by inputting income, expenses, savings, and investments, and visualizing key financial metrics through intuitive dashboards and charts. The app aims to provide a user-friendly interface, real-time data processing, and secure data handling to empower families to make informed financial decisions.

## Features

- **Data Input**: Form for inputting financial transactions (income, expenses, savings, investments) with validation and auto-save.
- **Dashboard**: KPI cards and charts for monthly financial metrics, income/expenses by category.
- **Income Overview**: Comparison of monthly income across periods with charts.
- **Expenses Overview**: Similar to income, with pie and stacked bar charts.
- **Savings & Investments**: Line chart for savings vs investments, percentage of income metrics.
- **Responsive Design**: Mobile-first with breakpoints at 360px, 744px, 1024px, 1440px.
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support.
- **Security**: JWT authentication, secure cookies, CSP, HSTS, OWASP compliance.

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Recharts, React-Hook-Form, React-Query, Zustand, Framer-Motion
- **Backend**: FastAPI, Pydantic, PostgreSQL, SQLAlchemy, Alembic
- **Auth**: JWT access & refresh tokens in HttpOnly cookies
- **Deployment**: Docker, Docker-Compose, Nginx (reverse-proxy + TLS), Ubuntu 22.04 LTS
- **Version Control**: Git, GitHub, conventional commits
- **QA**: Cypress, Playwright, Axe-core, Lighthouse CI

## Project Structure

```
/home/ubuntu/family-finances/
├── frontend/          # Next.js source code
│   ├── Dockerfile
│   └── next.config.js
├── backend/           # FastAPI source code
│   ├── Dockerfile
│   └── requirements.txt
├── nginx/             # Nginx configuration
│   ├── site.conf
│   └── snippets/
├── docker-compose.yml
├── .env               # Environment variables
├── .env.example       # Template for .env
├── scripts/           # Backup and utility scripts
└── logs/              # Application logs
```

## Installation & Setup

### Prerequisites

- Docker and Docker-Compose installed
- External PostgreSQL database
- Ubuntu 22.04 LTS (for production)

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd family-finances
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your database credentials and other settings.

4. Build and run the services:
   ```bash
   docker-compose up --build
   ```

5. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production Deployment

1. Set up VPS with Ubuntu 22.04 LTS, Docker, Nginx, etc.

2. Copy project files to `/home/ubuntu/family-finances/`

3. Update `.env` with production values.

4. Run Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. Configure Nginx for SSL/TLS with Let's Encrypt.

6. Set up database migrations and seed data.

See `todo.md` for detailed deployment steps.

## Environment Variables

- `POSTGRES_HOST`: PostgreSQL server host
- `POSTGRES_PORT`: PostgreSQL port (default 5432)
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name
- `DATABASE_URL`: Full database connection URL
- `JWT_SECRET`: Secret key for JWT tokens
- `COOKIE_DOMAIN`: Domain for cookies
- `NEXT_PUBLIC_API_URL`: Public API URL for frontend

## API Endpoints

- `GET /`: Dashboard data
- `GET /income-overview`: Income metrics and charts
- `GET /expenses-overview`: Expenses metrics and charts
- `GET /savings-investments`: Savings and investments data
- `POST /transactions`: Create new transaction
- `GET /transactions`: List transactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with conventional commits
4. Submit a pull request

## License

[Add license information]

## Contact

[Add contact information]