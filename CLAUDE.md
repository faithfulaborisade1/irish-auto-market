# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build the application (runs `prisma generate` first)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript compiler without emitting files

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database inspection
- `npm run db:seed` - Seed database with initial data

### Database Maintenance Scripts
- `npm run db:add-images` - Add image data to cars
- `npm run db:cleanup` - Clean up and fix database issues
- `npm run db:debug-images` - Debug image-related database issues
- `npm run db:replace-cars` - Replace car data
- `npm run db:fix-images` - Fix image URLs and data
- `npm run db:fresh-cars` - Add fresh car listings

## Code Architecture

### Application Structure
This is a Next.js 14 application using the App Router pattern with TypeScript, Tailwind CSS, and Prisma ORM.

**Core Technologies:**
- **Frontend:** Next.js 14 with App Router, React 18, TypeScript
- **Styling:** Tailwind CSS with custom components
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based with custom middleware
- **Image Management:** Cloudinary integration
- **State Management:** React Query (@tanstack/react-query)
- **UI Components:** Custom components with Radix UI primitives

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── admin/             # Admin dashboard and management
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   └── ui/               # Base UI components
├── contexts/             # React contexts (SocketContext)
├── data/                 # Static data (car makes/models, locations)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── middleware.ts         # Next.js middleware for auth and security
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

### Key Architecture Patterns

**Database Schema:**
- Complex relational model with Users, Cars, Dealers, Admin profiles
- Support for car listings, inquiries, conversations, notifications
- Admin audit logging and security events
- Dealer invitation system for onboarding

**Authentication & Authorization:**
- JWT-based authentication with custom middleware
- Role-based access control (USER, DEALER, ADMIN, SUPER_ADMIN)
- Admin-specific authentication with enhanced security
- CSRF protection and rate limiting (configurable via middleware)

**API Structure:**
- RESTful API routes in `src/app/api/`
- Separate admin APIs with enhanced security
- Real-time features using WebSocket contexts

**Security Features:**
- Comprehensive middleware with IP tracking and rate limiting
- Admin audit logging for all administrative actions
- Security event logging with severity levels
- CSRF protection for state-changing operations

### Import Aliases
Use these path aliases defined in tsconfig.json:
- `@/*` - src/ directory
- `@/components/*` - src/components/
- `@/lib/*` - src/lib/
- `@/types/*` - src/types/
- `@/utils/*` - src/utils/

### Database Connection
Prisma client is configured in `src/lib/prisma.ts` with query logging enabled in development. The connection uses environment variables for database URL configuration.

### Environment Setup
The application requires environment variables defined in `.env` or `.env.local`. Key variables include database connection, JWT secrets, Cloudinary configuration, and email service settings.

### Development Notes
- Uses TypeScript with strict configuration
- ESLint and TypeScript checking enabled for builds
- Image optimization configured for Cloudinary and other services
- Security headers configured in both middleware and Next.js config
- React Query for server state management with custom provider setup

### Testing & Validation
Before committing changes, ensure:
1. `npm run lint` passes without errors
2. `npm run type-check` completes successfully
3. `npm run build` completes without errors
4. Database migrations are properly tested with `npm run db:push`