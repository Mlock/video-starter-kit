# Frontend Architecture

## Project Overview

The frontend of the UVP Coaching Tool is built using **Next.js** with **TypeScript** for type safety and scalability. The UI components are styled with **Shadcn UI**, ensuring a modern and consistent design language throughout the application.

## Pages

1. **Home Page**
   - Overview of the tool
   - Call-to-action to start creating a UVP

2. **UVP Generator**
   - Form for users to input target audience details, problems solved, and differentiators
   - Button to generate UVP using OpenAI

3. **UVP Templates Library**
   - Browse and select from pre-built UVP examples tailored to various industries

4. **Refinement Page**
   - Display generated UVP
   - Provide AI-driven suggestions for refinement
   - Grammar and readability checks

5. **Competitor Benchmarks (Beta)**
   - Analyze and compare competitors’ UVPs
   - Identify strengths and gaps

6. **User Dashboard**
   - Save and manage created UVPs
   - Access templates and benchmarks

7. **Settings**
   - Manage account settings
   - Subscription and billing information

## Relevant Documentation

- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Shadcn UI Documentation**: [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- **TypeScript Documentation**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Supabase Integration**: [https://supabase.com/docs/guides/getting-started](https://supabase.com/docs/guides/getting-started)

## Backend Integration

The frontend communicates with the backend via Supabase APIs for data fetching, authentication, and real-time updates. OpenAI API is used for generating and refining UVPs.

## Coding Standards and Rules

- **Code Style**: Follow Airbnb’s TypeScript style guide
- **Linting**: ESLint configured for Next.js and TypeScript
- **Formatting**: Prettier for consistent code formatting
- **State Management**: Utilize React Context or Zustand for state management
- **Routing**: Next.js built-in routing
- **Accessibility**: Ensure all components meet WCAG 2.1 standards

## Technologies Used

- **Next.js**: React framework for server-side rendering and static site generation
- **TypeScript**: Superset of JavaScript for static type checking
- **Shadcn UI**: Component library for building consistent and customizable UI
- **React Query**: For data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework integrated with Shadcn UI
- **Axios or Fetch API**: For making API requests to OpenAI and Supabase
