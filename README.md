# Ethara Projects

Production-oriented collaborative project and task management app built with Next.js, Supabase, and Vercel deployment in mind.

## Phase 1 - Requirement Analysis

Modules:

- Authentication: signup, login, logout, JWT session persistence through Supabase Auth.
- Projects: create projects, list joined projects, admin-only project updates and membership control.
- Members: invite existing signed-up users by email, assign admin/member roles, prevent unsafe removal of the final admin.
- Tasks: create, assign, edit, delete, move through To Do, In Progress, and Done.
- Dashboard: aggregate project count, total tasks, status distribution, user workload, and overdue tasks.
- Access control: route protection, API validation, server-side role checks, and Supabase RLS.

Core workflows:

- User signs up, Supabase creates auth user and profile.
- User creates a project and becomes admin automatically through `create_project_with_admin`.
- Admin adds members by email and creates assigned tasks.
- Member sees only joined projects and their own assigned tasks.
- Member updates only their assigned task status.
- Admin sees and manages all project tasks and members.

Edge cases handled:

- Invalid payloads are rejected with Zod validation.
- Non-members cannot load project data.
- Members cannot edit task content or delete tasks.
- Tasks cannot be assigned to users outside the project.
- A project cannot lose its only admin through member removal.
- Overdue tasks exclude completed work.

Assumptions:

- Supabase Auth is the authentication authority, providing JWTs, password hashing, refresh tokens, and cookie-backed session persistence.
- Adding a member requires the user to have already signed up.
- Direct login after signup requires Supabase email confirmation to be disabled.

## Phase 2 - System Design

Tech stack:

- Next.js App Router for full-stack routing, server rendering, route handlers, and Vercel-native deployment.
- React functional components and hooks for UI state.
- Supabase Postgres for relational data, Supabase Auth for JWT authentication, and RLS for database-level enforcement.
- Zod for API input validation.
- dnd-kit for accessible Kanban drag and drop.
- Tailwind CSS for a compact, responsive SaaS UI.

Architecture:

- `src/app/(auth)` contains login and signup pages.
- `src/app/(workspace)` contains protected dashboard and project pages.
- `src/app/api` exposes REST-style route handlers.
- `src/components` contains UI modules grouped by feature.
- `src/lib/api` contains validation, auth guards, and API helpers.
- `src/lib/supabase` contains browser and server Supabase clients.
- `supabase/schema.sql` contains schema, relationships, RPC, indexes, triggers, and RLS policies.

API endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:memberId`
- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/projects/:projectId/tasks/:taskId`
- `DELETE /api/projects/:projectId/tasks/:taskId`
- `GET /api/dashboard`

Database schema:

- `profiles`: app-facing user profile linked to `auth.users`.
- `projects`: project records owned by creator.
- `project_members`: many-to-many relationship between projects and users with role.
- `tasks`: project tasks assigned to one user and created by one user.

## Phase 3 - UI/UX Design

The interface uses a restrained command-center layout rather than a generic template look:

- Auth pages use a split editorial panel and focused form.
- Dashboard shows high-signal analytics first, then status flow, workload, and overdue work.
- Projects page combines project creation and portfolio browsing in one screen.
- Project detail page combines member management and a three-column Kanban board.
- Admin controls are visible only to admins.
- Member experience removes unavailable controls and keeps status movement available for owned tasks.

Responsive behavior:

- Desktop uses a fixed icon rail and multi-column content.
- Mobile moves navigation to the bottom and stacks forms/cards.
- Task board columns stack on smaller screens.

## Phase 4 - Implementation

Important files:

- `supabase/schema.sql`
- `src/middleware.ts`
- `src/lib/api/auth.ts`
- `src/lib/api/validation.ts`
- `src/app/api/**/route.ts`
- `src/components/dashboard/DashboardClient.tsx`
- `src/components/projects/ProjectsClient.tsx`
- `src/components/tasks/ProjectWorkspace.tsx`

The codebase follows these rules:

- Route handlers validate every write request.
- API handlers centralize JSON responses and error formatting.
- Supabase Auth manages JWT sessions and password hashing.
- Supabase RLS backs up server-side role checks.
- Components are split by product domain.

## Phase 5 - Setup And Run

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Open Supabase Authentication, go to Providers, open Email, and turn off Confirm email so users can sign up and log in directly with email and password.
4. Copy `.env.example` to `.env.local`.
5. Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

6. Install dependencies:

```bash
npm install
```

7. Run locally:

```bash
npm run dev
```

8. Build for production:

```bash
npm run build
```

Vercel deployment:

- Push this repository to GitHub.
- Import it in Vercel.
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel project environment variables.
- Deploy with the default Next.js settings.
