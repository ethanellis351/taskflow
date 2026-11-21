# TaskFlow

Full-stack team task manager with authentication, project collaboration, task assignment, and due-date email reminders. Built with React, Node.js, Express, and PostgreSQL.

**Live demo:** coming soon

## Features

- User registration and login with JWT authentication and bcrypt password hashing
- Create projects and add teamates by email
- Role-based access: only a project's owner can add members
- Create, update, and delete tasks with status, assignee, and due date
- Access control on every route so users can only see their own projects

**In progress:** task board UI, due-date email reminders, automated tests with CI

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** JSON Web Tokens, bcryptjs

## Getting Started

## Prerequisites

- Node.js (LTS)
- PostgreSQL

### Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/ethanellis351/taskflow.git
    cd taskflow
    ```

2. Create a PostgreSQL database named `taskflow`, then run the SQL in `server/schema.sql` to create the tables.

3. Create `server/.env` with:

    ```
    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskflow
    PORT=4000
    JWT_SECRET=your_long_random_string
    ```

4. Install dependencies and start the server:

    ```bash
    cd server
    npm install
    npm run dev
    ```

5. In a second terminal, start the client:

    ```bash
    cd client
    npm install
    npm run dev
    ```

6. Open http://localhost:5173

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/auth/register | Create an account |
| POST | /api/auth/login | Log in and receive a token |
| GET | /api/auth/me | Get the current user |
| POST | /api/projects | Create a project |
| GET | /api/projects | List your projects |
| GET | /api/projects/:id | Get a project with members and tasks |
| POST | /api/projects/:id/members | Add a member (owner only) |
| POST | /api/projects/:id/tasks | Create a task |
| PATCH | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |

All routes except register and login require an `Authorization: Bearer <token>` header.

## Design Decisions

- Project creation runs in a database transaction so a project and its owner membership are created together or not at all.
- Every query checks project membership to prevent one user form accessing another team's data.
- Queries use parameterized placeholders to prevent SQL injection.

## What I'd Improve Next

- Move the auth token from localStorage to an httpOnly cookie
- Add refresh tokens
- Add pagination to project and task lists