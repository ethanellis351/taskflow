# TaskFlow

Full-stack team task manager with authentication, project collaboration, task assignment, a three-column task board, and due-date email reminders. Built with React, Node.js, Express, and PostgreSQL.

**Live demo:** coming soon

## Screenshots

### Task board (project owner)

![Task board, owner view](docs/screenshots/task-board-owner.png)

### Task board (team member)

Members can create, move, and assign tasks, but only the owner can add members or delete the project.

![Task board, member view](docs/screenshots/task-board-member.png)

### Projects page

![Projects page, owner view](docs/screenshots/projects-page-owner.png)

![Projects page, member view](docs/screenshots/projects-page-member.png)

### Due-date reminder email

![Reminder email](docs/screenshots/reminder-email.png)

## Features

- User registration and login with JWT authentication and bcrypt password hashing
- Projects page listing every project you belong to, with create and delete
- Add teammates to a project by email
- Role-based access: only a project's owner can add members or delete a project
- Task board with three columns (To Do, In Progress, Done), where tasks move between columns with one click
- Create, update, and delete tasks with a status, an assignee, and a due date
- Daily email reminders to assignees for tasks due today or tomorrow
- Access control on every route so users can only see their own projects

**In progress:** automated tests with CI

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** JSON Web Tokens, bcryptjs
- **Email and scheduling:** Nodemailer, node-cron

## Getting Started

### Prerequisites

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

    Email settings are optional. See [Email reminders](#email-reminders).

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

## Email reminders

A scheduled job runs every day at 8:00 AM (server time). It emails the assignee of each task that is due today or tomorrow and not yet done, then records that the reminder was sent so nobody is emailed twice. If a task's due date changes, it becomes eligible for a new reminder.

By default, emails go to a free [Ethereal](https://ethereal.email) test inbox, and the server prints a preview link in the terminal, so no real email is sent during development. To send real email, add these variables to `server/.env`:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM=TaskFlow <no-reply@example.com>
```

To run the reminder check immediately instead of waiting for 8:00 AM:

```bash
cd server
node runReminders.js
```

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
| DELETE | /api/projects/:id | Delete a project (owner only) |
| PATCH | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |

All routes except register and login require an `Authorization: Bearer <token>` header.

## Design Decisions

- Project creation runs in a database transaction so a project and its owner membership are created together or not at all.
- Every query checks project membership to prevent one user from accessing another team's data.
- Owner-only actions (adding members, deleting a project) are enforced on the server, and the frontend only hides the buttons.
- Queries use parameterized placeholders to prevent SQL injection.
- A task is marked as reminded only after its email sends successfully, so a failed send is retried on the next run.

## What I'd Improve Next

- Move the auth token from localStorage to an httpOnly cookie
- Add refresh tokens
- Add pagination to project and task lists
- Run the reminder job in a separate worker, or claim tasks with a database lock, so several server instances never send duplicate emails
- Store a time zone per user so reminders go out at a sensible local time