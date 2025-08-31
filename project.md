Project Overview
The Family Financial App is a web application built using Next.js, Tailwind CSS, and FastAPI. It enables families to track and manage their finances by inputting income, expenses, savings, and investments, and visualizing key financial metrics through intuitive dashboards and charts. The app aims to provide a user-friendly interface, real-time data processing, and secure data handling to empower families to make informed financial decisions.
Project Goals
• Allow users to input financial data (income, expenses, savings, investments) with relevant details.
• Provide a dashboard to visualize monthly financial metrics (income, expenses, savings, investments).
• Display charts for income by category (column chart) and expenses by category (pie chart).
• Offer an income overview page comparing monthly income across periods.
• Offer an expenses overview page comparing monthly expenses across periods.
• Provide a savings and investments page with a line chart and percentage-of-income metrics.
• Ensure a responsive, accessible, and secure user experience.
• Deliver an 8-point design system (colors, typography, spacing, elevation, icons, forms, charts, motion).
• Target 100 % WCAG 2.1 AA compliance, dark/light mode parity, and sub-2-second perceived load.
Main Rules and Guidelines
Tech Stack
• Frontend: Next.js, TypeScript, Tailwind CSS, Recharts, React-Hook-Form, React-Query, Zustand, Framer-Motion.
• Backend: FastAPI, Pydantic, PostgreSQL, SQLAlchemy.
• Auth: JWT, refresh tokens, secure HTTP-only cookies.
• Deployment: Docker, GitHub Actions, AWS ECS Fargate, RDS PostgreSQL, CloudFront CDN.
• Version Control: GitHub, trunk-based, conventional commits, PR templates.
• QA: Cypress + Playwright for E2E, Axe-core for a11y, Lighthouse CI.
Non-Functional Requirements
• Performance: < 1.5 s initial paint, < 200 ms API p95, < 100 ms chart interaction.
• Accessibility: WCAG 2.1 AA, keyboard-only flow, screen-reader labels, reduced-motion support.
• Security: CSP, HSTS, SRI, OWASP Top-10 compliance, Snyk/Dependabot scanning.
• Scalability: 10 k active users, 1 M transactions, auto-scaling to 3×.
• Responsive: Mobile-first breakpoints 360 px, 744 px, 1024 px, 1440 px.
Current Infrastructure Setup

The project uses a Docker Compose stack deployed on an Ubuntu 22.04 LTS VPS with the following services:

- Backend: FastAPI application built with Python 3.11-slim, exposing port 8000
- Frontend: Next.js application built with Node.js 20, exposing port 3000
- Nginx: Reverse-proxy with SSL/TLS, routing to frontend and backend, including security headers

Database: External PostgreSQL instance (not included in Docker Compose)

Environment variables are managed via .env file, with .env.example as template.

Nginx configuration includes SSL certificates from Let's Encrypt, HSTS, CSP, and X-Frame-Options headers.

User Stories
• As a user, I want to input my family’s financial transactions in < 30 s.
• As a user, I want to see my financial health at a glance on any device.
• As a user, I want to compare income and expenses across months with one click.
• As a user, I want to know what % of income is saved or invested instantly.
• As a visually impaired user, I can complete any task via keyboard and screen reader.
• As a parent, I can switch to dark mode at night without losing context.
Features and Requirements
Data Input Page
• Form fields: Date picker (calendar pop-over), Type toggle (income|expense|savings|investment), Person autocomplete, Category dynamic chips, Description (max 200 chars, character counter), Amount with currency mask.
• Real-time validation: inline errors, success toast, auto-save draft every 5 s.
• Accessibility: labelled inputs, error announcements, focus trapping.
• Responsive: collapsible bottom sheet on mobile.
Dashboard
• KPI cards: income, expenses, savings, investments, net flow, % variance vs last month.
• Charts: Recharts column (income by category), pie (expenses by category) with drill-down, line (net flow trend).
• Month selector: side-drawer calendar with mini-chart preview.
• Micro-interactions: hover glow, animated counters, skeleton shimmer.
Income Overview Page
• Metrics: total, average, MoM %, YoY %, category table with sparklines.
• Chart: multi-line income trends with toggle legend.
• Filter chips: member, category, date range.
Expenses Overview Page
• Metrics: identical to income.
• Chart: pie + stacked bar for category breakdown.
• Color-blind safe palette.
Savings & Investments Page
• Metrics: total, % of income, goal progress rings.
• Chart: dual-axis line (savings vs investments).
• Scenario slider: “what if I invest X more”.
Team Responsibilities and Deliverables
UI/UX Design Team
• Deliverables
– 8-point design system: tokens, components, patterns, motion library (Framer-Motion).
– Responsive wireframes → high-fidelity Figma mock-ups (mobile, tablet, desktop).
– Interactive prototype (Figma variables for dark/light).
– Accessibility checklist & contrast report (Stark).
– Icon set (Heroicons + custom 24 px grid).
– Chart color tokens (color-blind safe).
– Empty-state, loading-state, and error-state illustrations.
– Design QA checklist for pixel-perfect handoff.
• Sprint-by-Sprint Tasks
– Sprint 1: Kick-off workshop, 5-day design sprint, wireframes, style tiles, design tokens.
– Sprint 2: Final mock-ups, component library in Figma, responsive specs, usability tests (5 users).
– Sprint 3: Motion guidelines, dark mode assets, accessibility fixes, micro-copy review.
– Sprint 4: Design QA, pixel regression fixes, hand-off package (Storybook link, Zeplin/Figma inspect).
Frontend Team (Next.js, Tailwind CSS)
• Deliverables: responsive, mobile-first components, real-time validation, Recharts charts (interactive, CSV/PDF export), date/month selector (dropdown + calendar), dark/light toggle, skeleton loaders, React-Query caching, Zustand state, Cypress E2E.
• Sprint Tasks (see Additional Frontend Timeline).
Backend Team (FastAPI)
• Deliverables: CRUD /transactions, /dashboard, /income-overview, /expenses-overview, /savings-investments, JWT auth, Pydantic models, aggregation SQL, rate limiting, Pytest 90 % coverage.
• Tasks unchanged but aligned with new chart payloads.
DevOps Team
• Deliverables: GitHub Actions CI/CD, Docker multi-stage, AWS ECS, RDS, CloudWatch, S3 backups, HTTPS auto-renew.
• Tasks unchanged.
QA Testing Team
• Deliverables: Test plan, Cypress/Playwright E2E, a11y audit (Axe), Lighthouse CI, responsive matrix, visual regression (Percy).
• Tasks unchanged, but must validate design tokens and motion.
Project Timeline (8 Weeks, 4 Sprints)
Sprint 1 (Weeks 1–2)
• UI/UX: Design sprint, personas, JTBD, wireframes, style tiles, design tokens, 8-point system foundations.
• Frontend: Next.js + TypeScript + Tailwind scaffold, global layout, tokens in tailwind.config.ts, placeholder pages, navigation.
• Backend: DB schema, /transactions CRUD scaffold, Docker local.
• DevOps: GitHub Actions CI pipeline, Docker compose.
• QA: Test plan, a11y checklist draft.
Sprint 2 (Weeks 3–4)
• UI/UX: Final mock-ups, responsive specs, Figma component library, usability testing, design QA checklist.
• Frontend: Data input form (React-Hook-Form, real-time validation, inline errors), loading skeletons, mock API integration.
• Backend: Dashboard & overview APIs, aggregation queries, Pytest.
• DevOps: Staging AWS ECS deploy.
• QA: Functional tests, design regression.
Sprint 3 (Weeks 5–6)
• UI/UX: Motion design tokens, dark mode tokens, accessibility fixes, micro-copy.
• Frontend: Integrate Recharts, month selector, dark mode toggle, responsive refinements, React-Query caching.
• Backend: Savings/Investments APIs, security hardening.
• DevOps: Monitoring, alerts.
• QA: E2E, a11y, visual regression.
Sprint 4 (Weeks 7–8)
• UI/UX: Final design QA, pixel-perfect handoff, Storybook link, Zeplin spec.
• Frontend: Performance budget (bundle < 200 kB), micro-interactions, final a11y audit, Lighthouse 95+.
• Backend: Rate limiting, performance optimization.
• DevOps: Production cut-over, backups, CDN.
• QA: Regression, load test 10 k users, release sign-off.
