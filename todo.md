# Todo List for Family Financial App

This document outlines all features needed to run the website, based on project.md and additional requisites. Each item is broken into small, actionable steps. Use [ ] for not done, [x] for done.

## Core Infrastructure Setup
- [X] Set up PostgreSQL database (external instance)
- [X] Configure environment variables in .env file
- [X] Build and run Docker Compose services (backend, frontend, nginx)
- [X] Set up SSL/TLS with Let's Encrypt for nginx
- [X] Configure security headers in nginx (CSP, HSTS, etc.)

## Backend Development (FastAPI)
- [x] Create FastAPI application structure (main.py, routers, models)
- [x] Implement JWT authentication with refresh tokens and HTTP-only cookies
- [x] Set up SQLAlchemy models for users, transactions, categories
- [X] Create database schema with Alembic migrations
- [x] Implement CRUD endpoints for transactions (/transactions)
- [x] Implement dashboard API (/dashboard) with KPI calculations
- [x] Implement income overview API (/income-overview) with aggregations
- [ ] Implement expenses overview API (/expenses-overview) with aggregations
- [ ] Implement savings & investments API (/savings-investments)
- [ ] Add rate limiting and security hardening
- [ ] Write Pytest unit tests (90% coverage)
- [x] Set up Pydantic models for request/response validation

## Frontend Development (Next.js)
- [x] Scaffold Next.js project with TypeScript and Tailwind CSS
- [x] Implement global layout and navigation
- [ ] Set up design system tokens in tailwind.config.ts (8-point grid, colors, typography)
- [x] Create authentication pages (login, register)
- [x] Build data input form with React-Hook-Form (date picker, type toggle, validation)
- [ ] Implement dashboard page with KPI cards and Recharts (column, pie, line charts)
- [ ] Create income overview page with multi-line chart and filters
- [ ] Create expenses overview page with pie + stacked bar charts
- [ ] Create savings & investments page with dual-axis line chart
- [ ] Add month selector with calendar popover
- [ ] Implement dark/light mode toggle
- [ ] Add loading skeletons and micro-interactions (Framer-Motion)
- [x] Integrate React-Query for API caching
- [x] Set up Zustand for state management
- [ ] Ensure responsive design (mobile-first breakpoints)
- [ ] Implement accessibility features (WCAG 2.1 AA, keyboard navigation, screen readers)
- [ ] Add real-time validation and auto-save drafts
- [ ] Implement error handling and toast notifications

## Authentication & Security
- [x] Implement user registration and login endpoints
- [x] Set up JWT token generation and validation
- [ ] Configure secure HTTP-only cookies for tokens
- [x] Add password hashing with bcrypt
- [x] Implement logout and token refresh mechanisms
- [ ] Add OWASP Top-10 security measures
- [ ] Set up Snyk/Dependabot for dependency scanning

## Database & Data Management
- [x] Design database schema for users, transactions, categories
- [ ] Set up Alembic for database migrations
- [ ] Implement data seeding for initial categories
- [ ] Add data validation and constraints
- [ ] Set up database backups and recovery

## Deployment & DevOps
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Configure Docker multi-stage builds
- [ ] Deploy to AWS ECS Fargate with RDS PostgreSQL
- [ ] Set up CloudWatch monitoring and alerts
- [ ] Configure CloudFront CDN
- [ ] Implement auto-scaling for 10k users
- [ ] Set up HTTPS auto-renewal

## QA & Testing
- [ ] Write Cypress E2E tests for critical flows
- [ ] Write Playwright E2E tests
- [ ] Perform accessibility audit with Axe-core
- [ ] Set up Lighthouse CI for performance monitoring
- [ ] Implement visual regression testing with Percy
- [ ] Test responsive design across breakpoints
- [ ] Conduct load testing for 10k users

## Additional Requisite: Receipt Upload and Processing
- [x] Create database tables for receipts (market, branch, date, total, user_id)
- [x] Create database table for receipt products (product, type, quantity, price, discount, discount2, receipt_id)
- [x] Implement API endpoint for receipt upload (POST /receipts/upload)
- [x] Add file upload handling with python-multipart
- [x] Integrate external API for PDF text extraction
- [x] Parse extracted data into structured format (Market, Branch, Date, Total, Products)
- [x] Validate and store receipt data in database
- [x] Associate receipts with authenticated user
- [x] Implement error handling for invalid PDFs or API failures
- [x] Add receipt listing endpoint (GET /receipts)
- [x] Create frontend page for receipt upload with file input
- [x] Display upload progress and success/error messages
- [x] Add receipt details view with extracted information

## Additional Requisite: Spending Overview and Receipt Details
- [x] Create API endpoint for spending summary (GET /spending/summary) with week/month filters
- [x] Implement aggregation queries for spending by period
- [x] Create API endpoint for individual receipt details (GET /receipts/{id})
- [x] Ensure receipts are user-specific (filter by user_id)
- [x] Prevent unauthorized access to other users' receipts
- [x] Create frontend page for spending overview with charts (weekly/monthly spending)
- [x] Add filters for date range and period type
- [x] Create frontend page for receipt details with full information
- [x] Implement navigation between spending overview and receipt details
- [x] Add export functionality for spending reports (CSV/PDF)
- [x] Ensure responsive design for new pages

## Performance & Optimization
- [ ] Optimize bundle size (< 200 kB for frontend)
- [ ] Implement caching strategies (React-Query, CDN)
- [ ] Add lazy loading for components and routes
- [ ] Optimize database queries with indexing
- [ ] Implement pagination for large data sets
- [ ] Monitor and optimize API response times (< 200 ms p95)

## Final Touches
- [ ] Implement empty states, loading states, and error states
- [ ] Add micro-interactions and animations
- [ ] Conduct final accessibility audit
- [ ] Perform cross-browser testing
- [ ] Set up production monitoring and logging
- [ ] Create user documentation and onboarding