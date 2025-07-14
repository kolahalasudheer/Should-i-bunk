# Should I Bunk? - Full Stack Web Application

## Overview

"Should I Bunk?" is a full-stack web application that helps students make informed decisions about whether to attend class or skip it. The application uses a smart rule-based scoring engine combined with AI-powered features to provide personalized recommendations, excuses, and insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Mobile-First Design
- Responsive design optimized for mobile devices
- Bottom navigation pattern for mobile UX
- Maximum width constraints for desktop viewing

## Key Components

### Decision Engine
- **Scoring Service**: Rule-based algorithm that weighs multiple factors:
  - Attendance percentage (40% weight)
  - Days until exam (20% weight)
  - Mood state (15% weight)
  - Weather conditions (15% weight)
  - Professor strictness (10% weight)
- **AI Service**: Cohere API integration for generating creative excuses and explanations
- **Weather Service**: OpenWeatherMap API for real-time weather data

### Core Features
1. **Bunk Decision Form**: Input collection for scoring algorithm
2. **Decision Results**: AI-generated recommendations with scores
3. **Friend Voting**: Social feature for peer input on decisions
4. **Confession Wall**: Anonymous sharing platform
5. **Badge System**: Gamification with achievement tracking
6. **Analytics Dashboard**: Personal insights and patterns

### User Interface Components
- **Header**: Navigation with user profile and notifications
- **Bottom Navigation**: Primary navigation for mobile
- **Cards**: Consistent card-based layout for all features
- **Forms**: React Hook Form with Zod validation
- **Toasts**: User feedback system

## Data Flow

### Authentication Flow
1. User authenticates via Replit Auth (OpenID Connect)
2. Session stored in PostgreSQL with automatic cleanup
3. User profile created/updated in database
4. Protected routes enforce authentication

### Decision Making Flow
1. User inputs personal factors (attendance, mood, etc.)
2. Weather data fetched from OpenWeatherMap API
3. Scoring algorithm calculates bunk score
4. AI generates personalized excuse and analysis
5. Decision stored in database with user association
6. Friend voting enabled for social input

### Data Persistence
- User profiles and sessions
- Bunk decisions with full context
- Friend votes and social interactions
- Anonymous confessions
- User badges and achievements
- Analytics data for insights

## External Dependencies

### APIs
- **Cohere API**: AI text generation for excuses and explanations
- **OpenWeatherMap API**: Real-time weather data
- **Replit Auth**: Authentication and user management

### Key Libraries
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **react-hook-form**: Form management
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for TypeScript execution
- Automatic recompilation and restart
- Environment variables for API keys

### Production Build
- Vite builds optimized frontend bundle
- esbuild bundles backend for Node.js
- Static assets served from Express
- Database migrations via Drizzle Kit

### Environment Configuration
- DATABASE_URL: PostgreSQL connection string
- COHERE_API_KEY: AI service authentication
- OPENWEATHER_API_KEY: Weather service authentication
- SESSION_SECRET: Session encryption key
- REPLIT_DOMAINS: Authentication domain configuration

### Database Schema
- Sessions table for authentication
- Users table for profile data
- Bunk decisions with full context
- Friend votes for social features
- Confessions for anonymous sharing
- User badges for gamification
- Proper indexes for performance

The application follows a mobile-first, component-based architecture with strong typing throughout the stack. The scoring algorithm provides the core decision-making logic while AI enhances the user experience with personalized content.