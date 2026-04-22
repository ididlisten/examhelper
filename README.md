# 考试日程智能提醒系统

An intelligent exam schedule reminder system designed for college students to manage exams, track review progress, and receive smart reminders.

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   ├── constants.ts       # Environment and app constants
│   │   └── passport.ts        # JWT authentication strategy
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   ├── schema.ts          # Drizzle ORM schema (Users, Exams, Reminders, ReviewTasks, NotificationSettings)
│   │   └── migrations/
│   │       ├── 0_init_add_user_model.sql
│   │       └── 1773471693904_add_exams_reminders.sql
│   ├── middleware/
│   │   ├── auth.ts            # JWT middleware (authenticateJWT, authenticateLocal)
│   │   └── errorHandler.ts    # Global error handler
│   ├── repositories/
│   │   ├── users.ts           # User data access
│   │   ├── exams.ts           # Exam CRUD operations
│   │   └── reminders.ts       # Reminders, ReviewTasks, NotificationSettings
│   ├── routes/
│   │   ├── auth.ts            # POST /api/auth/signup, /login, GET /me
│   │   ├── exams.ts           # CRUD /api/exams, PATCH /api/exams/:id/progress
│   │   └── reminders.ts       # /api/reminders/settings, /tasks, /
│   └── server.ts              # Express entry point
├── frontend/
│   └── src/
│       ├── App.tsx            # Root with HashRouter + AuthProvider + protected routes
│       ├── pages/
│       │   └── Index.tsx      # Main dashboard (all views: dashboard, exams, calendar, review, reminders, profile)
│       ├── components/
│       │   ├── custom/
│       │   │   ├── Login.tsx  # Login form
│       │   │   └── Signup.tsx # Signup form
│       │   └── ui/            # shadcn/ui components
│       ├── contexts/
│       │   └── AuthContext.tsx # JWT auth state management
│       ├── lib/
│       │   ├── api.ts         # All API service functions
│       │   └── utils.ts
│       ├── types/
│       │   └── index.ts       # Shared TypeScript types
│       └── index.css          # Academic Clarity design tokens (oklch colors)
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS V4, shadcn/ui, React Router DOM (HashRouter)
- **Backend**: Express.js, TypeScript, Drizzle ORM, Passport.js JWT
- **Database**: PostgreSQL (via postgres.js driver)
- **Auth**: JWT tokens stored in localStorage

## Key Features

1. **User Authentication** - Signup/Login with JWT, protected routes
2. **Exam Management** - Add/Edit/Delete exams with name, date, time, location, type, notes
3. **Smart Reminders** - Configurable 7-day, 3-day, 1-day, same-day reminders + custom intervals
4. **Calendar View** - Monthly calendar with color-coded exam dots by type
5. **Review Plan Tracking** - Progress bars per exam, daily task management
6. **Notification Settings** - System/Push/Email channels, custom reminder timing
7. **Profile Management** - Update name, change password, logout

## Design System

Academic Clarity style: Deep navy (`oklch(0.28 0.07 240)`) primary, warm amber (`oklch(0.75 0.15 75)`) accent, light blue-gray background (`oklch(0.955 0.012 240)`). Georgia serif for headings, system-ui for body.

## API Routes

- `POST /api/auth/signup` - Register with `{ name, email, password, confirmPassword }`
- `POST /api/auth/login` - Login with `{ email, password }`
- `GET /api/auth/me` - Get current user (JWT required)
- `GET/POST /api/exams` - List/Create exams
- `PUT/DELETE /api/exams/:id` - Update/Delete exam
- `PATCH /api/exams/:id/progress` - Update review progress
- `GET/PUT /api/reminders/settings` - Notification settings
- `GET/POST /api/reminders/tasks` - Review tasks
- `PUT/DELETE /api/reminders/tasks/:id` - Update/Delete task

## Code Generation Guidelines

- All views are rendered inline in `frontend/src/pages/Index.tsx` via `renderContent()` switch
- Navigation state managed with `useState<ViewType>` in Index.tsx
- API calls use functions from `frontend/src/lib/api.ts` with `getAuthHeaders()` helper
- Backend routes all use `authenticateJWT` middleware from `backend/middleware/auth.ts`
- Repository pattern: routes → repositories → Drizzle ORM
- Zod validation at route boundary, type assertions (`as InsertX`) in repository `.values()` calls
