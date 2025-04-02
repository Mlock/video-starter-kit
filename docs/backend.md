# Backend Architecture

## Project Overview

The backend of the UVP Coaching Tool is powered by **Supabase**, which provides a robust and scalable backend-as-a-service solution. Supabase handles the database, authentication, and API endpoints, ensuring seamless integration with the frontend.

## Technology Stack

- **Supabase**: Backend-as-a-Service platform
  - **Database**: PostgreSQL
  - **Authentication**: Supabase Auth
  - **Storage**: For any file storage needs
  - **Edge Functions**: Serverless functions for custom backend logic
- **OpenAI API**: For AI-driven UVP generation and refinement
- **Next.js API Routes**: Additional server-side logic if needed

## Database Schema

### Tables

1. **Users**
   - `id` (UUID, Primary Key)
   - `email` (String, Unique)
   - `password` (Hashed)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

2. **UVPs**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to Users)
   - `audience_details` (JSON)
   - `problems_solved` (Text)
   - `differentiators` (Text)
   - `generated_uvp` (Text)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

3. **Templates**
   - `id` (UUID, Primary Key)
   - `industry` (String)
   - `template_text` (Text)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

4. **Competitors**
   - `id` (UUID, Primary Key)
   - `uvp` (Text)
   - `business_name` (String)
   - `industry` (String)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

5. **Feedback**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to Users)
   - `uvp_id` (UUID, Foreign Key to UVPs)
   - `feedback_text` (Text)
   - `created_at` (Timestamp)

## Business Logic

- **User Authentication**: Handle user sign-up, login, and authentication using Supabase Auth.
- **UVP Generation**: 
  - Receive user inputs from the frontend.
  - Call OpenAI API to generate a draft UVP based on inputs.
  - Store the generated UVP in the `UVPs` table.
- **UVP Refinement**:
  - Provide real-time AI feedback by sending the UVP to OpenAI for suggestions.
  - Update the UVP based on user refinements.
- **Templates Management**:
  - CRUD operations for UVP templates.
  - Filter templates by industry.
- **Competitor Benchmarking**:
  - Analyze and store competitor UVPs.
  - Provide comparison metrics to users.
- **Feedback Collection**:
  - Allow users to submit feedback on UVPs.
  - Store feedback for future improvements.

## Requirements

### Functional Requirements

1. **User Management**
   - Users can create accounts, log in, and manage their profiles.
   
2. **UVP Management**
   - Users can create, view, edit, and delete their UVPs.
   - Ability to generate UVPs using AI.
   - Access to UVP templates and competitor benchmarks.
   
3. **Templates Library**
   - Users can browse and apply industry-specific UVP templates.
   
4. **AI Integration**
   - Generate and refine UVPs using OpenAI.
   - Ensure secure handling of API keys and data.

5. **Competitor Benchmarks**
   - Allow users to input or fetch competitor UVPs.
   - Provide analysis and insights based on competitor data.

6. **Feedback System**
   - Enable users to provide feedback on generated UVPs.
   - Utilize feedback to improve AI suggestions.

### Non-Functional Requirements

1. **Scalability**
   - Design the database and backend to handle growing user base and data volume.
   
2. **Security**
   - Protect user data with encryption and secure authentication.
   - Ensure secure communication between frontend and backend.
   
3. **Performance**
   - Optimize API response times.
   - Ensure real-time features (like AI suggestions) are responsive.

4. **Reliability**
   - Implement error handling and logging.
   - Ensure high availability of the backend services.

## API Endpoints

### Authentication

- `POST /auth/signup`: Register a new user
- `POST /auth/login`: Authenticate a user
- `POST /auth/logout`: Log out a user

### UVPs

- `GET /uvps`: Retrieve all UVPs for the authenticated user
- `POST /uvps`: Create a new UVP
- `GET /uvps/{id}`: Retrieve a specific UVP
- `PUT /uvps/{id}`: Update a specific UVP
- `DELETE /uvps/{id}`: Delete a specific UVP

### Templates

- `GET /templates`: Retrieve all templates
- `POST /templates`: Create a new template (Admin only)
- `GET /templates/{id}`: Retrieve a specific template
- `PUT /templates/{id}`: Update a specific template (Admin only)
- `DELETE /templates/{id}`: Delete a specific template (Admin only)

### Competitors

- `GET /competitors`: Retrieve competitor UVPs
- `POST /competitors`: Add a new competitor UVP
- `GET /competitors/{id}`: Retrieve a specific competitor UVP
- `PUT /competitors/{id}`: Update a specific competitor UVP
- `DELETE /competitors/{id}`: Delete a specific competitor UVP

### Feedback

- `POST /feedback`: Submit feedback for a UVP
- `GET /feedback/{uvp_id}`: Retrieve feedback for a specific UVP

