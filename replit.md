# LinuxHelp - Community Forum for Linux Support

## Overview

LinuxHelp is a community-driven Q&A forum for Linux troubleshooting and support. Users can browse questions, post their own issues, and find solutions with code examples, screenshots, and media attachments. The platform is inspired by Stack Overflow and Reddit, emphasizing information density, readability, and efficient navigation for technical content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode support)
- **Design System**: Orange and black color palette with focus on technical readability
- **File Uploads**: Uppy library with AWS S3-compatible presigned URL uploads

### Backend Architecture

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful JSON API endpoints under `/api/*`
- **Build Process**: esbuild for server bundling, Vite for client

### Data Storage

- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Object Storage**: Google Cloud Storage via Replit's sidecar integration for file uploads

### Key Data Models

- **Users**: Basic authentication with username/password
- **Categories**: Question categorization with icons and colors
- **Questions**: Main content with votes, views, media attachments, and code snippets
- **Answers**: Responses to questions with voting and acceptance status
- **FAQs**: Pre-populated frequently asked questions

### Project Structure

```
client/           # React frontend application
  src/
    components/   # Reusable UI components
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
  replit_integrations/  # Object storage integration
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```

## External Dependencies

### Database
- PostgreSQL database (configured via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe queries and migrations

### Object Storage
- Google Cloud Storage for file uploads (images, videos)
- Presigned URL flow for secure direct uploads from browser
- Configured through Replit's sidecar endpoint at `127.0.0.1:1106`

### Third-Party Libraries
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, tooltips, etc.
- **Uppy**: File upload handling with dashboard UI
- **date-fns**: Date formatting utilities
- **Zod**: Schema validation for forms and API inputs
- **React Hook Form**: Form state management with Zod integration