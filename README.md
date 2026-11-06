# Vistula Task Manager

A simple Task Manager built with HTML, CSS and JavaScript. Tasks are stored in a Supabase (PostgreSQL) database and accessed through the Supabase REST API. The site is hosted on GitHub Pages.

Course: Team Project – IT, Practical Assignment 1

**Student ID:** 79822

## Links

- Application: https://vistula-team-project-79822.github.io/vistula-task-manager/
- Contributor page: https://vistula-team-project-79822.github.io/vistula-task-manager/contribution.html
- Contributor JSON: https://vistula-team-project-79822.github.io/vistula-task-manager/contribution.json
- Repository: https://github.com/vistula-team-project-79822/vistula-task-manager

## Pull Requests

- Pull Request I created in my partner's repository: _link will be added_
- Pull Request my partner created in this repository: _link will be added_

## Features

- Display all tasks from the database
- Add, edit and delete tasks
- Mark tasks as completed or incomplete
- Changes persist after page refresh
- Error messages are shown when an operation fails

## REST API operations used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/tasks?select=*` | Get all tasks |
| GET | `/tasks?id=eq.{id}&select=*` | Get one task |
| POST | `/tasks` | Create a task |
| PUT | `/tasks?id=eq.{id}` | Save a complete task (edit, toggle status) |
| DELETE | `/tasks?id=eq.{id}` | Delete a task |

## Files

- `index.html` – main page
- `app.js` – application logic
- `config.json` – public Supabase configuration (publishable key only)
- `contribution.html`, `contribution.json` – added by my partner through a Pull Request
