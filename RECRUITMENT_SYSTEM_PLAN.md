# Comprehensive Recruitment Management System Plan
## Laravel Application + ChatGPT MCP Integration

---

## Overview

This plan outlines the development of a comprehensive recruitment management system consisting of:
1. **Laravel Backend API** - Core recruitment data management
2. **MCP Server** - Tool definitions for ChatGPT integration
3. **React Components** - Interactive UI rendered within ChatGPT
4. **ChatGPT Interface** - Natural language interaction layer

---

## Part 1: Laravel Recruitment Application

### 1.1 Database Schema

#### Recruitments Table
```sql
- id (bigint, primary key)
- title (string, 255)
- company_name (string, 255)
- location (string, 255)
- employment_type (enum: full-time, part-time, contract, internship)
- salary_min (decimal, nullable)
- salary_max (decimal, nullable)
- salary_currency (string, default: USD)
- description (text)
- requirements (text)
- responsibilities (text)
- benefits (text, nullable)
- application_deadline (date, nullable)
- status (enum: draft, published, closed, filled)
- created_by (bigint, foreign key to users)
- created_at (timestamp)
- updated_at (timestamp)
- published_at (timestamp, nullable)
```

#### Users Table (Laravel default + modifications)
```sql
- id (bigint, primary key)
- name (string, 255)
- email (string, 255, unique)
- password (string)
- role (enum: admin, recruiter, viewer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Applications Table (for tracking recruitment applications)
```sql
- id (bigint, primary key)
- recruitment_id (bigint, foreign key)
- applicant_name (string, 255)
- applicant_email (string, 255)
- applicant_phone (string, nullable)
- resume_path (string, nullable)
- cover_letter (text, nullable)
- status (enum: pending, reviewing, shortlisted, rejected, hired)
- applied_at (timestamp)
- updated_at (timestamp)
```

### 1.2 Laravel API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get authenticated user

#### Recruitments
- `GET /api/recruitments` - List all recruitments (with filters)
- `GET /api/recruitments/{id}` - Get single recruitment
- `POST /api/recruitments` - Create new recruitment
- `PUT /api/recruitments/{id}` - Update recruitment
- `DELETE /api/recruitments/{id}` - Delete recruitment
- `PATCH /api/recruitments/{id}/publish` - Publish recruitment
- `PATCH /api/recruitments/{id}/close` - Close recruitment

#### Applications
- `GET /api/recruitments/{id}/applications` - List applications for recruitment
- `POST /api/applications` - Submit application
- `PATCH /api/applications/{id}/status` - Update application status

#### Statistics
- `GET /api/statistics/overview` - Get recruitment statistics
- `GET /api/statistics/by-status` - Get counts by status

### 1.3 Laravel Project Structure

```
recruitment-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── RecruitmentController.php
│   │   │   │   ├── ApplicationController.php
│   │   │   │   └── StatisticsController.php
│   │   ├── Requests/
│   │   │   ├── StoreRecruitmentRequest.php
│   │   │   └── UpdateRecruitmentRequest.php
│   │   └── Resources/
│   │       ├── RecruitmentResource.php
│   │       └── ApplicationResource.php
│   ├── Models/
│   │   ├── Recruitment.php
│   │   ├── Application.php
│   │   └── User.php
│   ├── Policies/
│   │   └── RecruitmentPolicy.php
│   └── Services/
│       └── RecruitmentService.php
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_create_recruitments_table.php
│   │   └── 2024_01_02_create_applications_table.php
│   └── seeders/
│       └── RecruitmentSeeder.php
└── routes/
    └── api.php
```

### 1.4 Key Laravel Features to Implement

1. **Authentication** - Laravel Sanctum for API token authentication
2. **Authorization** - Policies for recruitment management
3. **Validation** - Form Request classes for input validation
4. **Resource Transformation** - API Resources for consistent JSON responses
5. **Query Filters** - Filterable/searchable recruitment listings
6. **File Upload** - For applicant resumes
7. **Event/Logging** - Track recruitment status changes
8. **CORS Configuration** - Allow MCP server access

---

## Part 2: ChatGPT MCP Server

### 2.1 MCP Server Architecture

The MCP server acts as a bridge between ChatGPT and the Laravel API, exposing recruitment management capabilities as "tools" that ChatGPT can invoke.

**Technology Stack:**
- Node.js with TypeScript
- MCP SDK (`@modelcontextprotocol/sdk`)
- Axios for Laravel API communication
- React for UI components

### 2.2 MCP Tools Definition

#### Tool 1: list_recruitments
**Purpose:** Retrieve and display recruitment listings

**Parameters:**
```typescript
{
  status?: 'draft' | 'published' | 'closed' | 'filled',
  search?: string,
  employment_type?: string,
  limit?: number,
  page?: number
}
```

**Output:** Returns component metadata to render recruitment list UI

**Display Mode:** Inline

---

#### Tool 2: get_recruitment_details
**Purpose:** Fetch detailed information about a specific recruitment

**Parameters:**
```typescript
{
  recruitment_id: number
}
```

**Output:** Returns component metadata with recruitment details

**Display Mode:** Fullscreen

---

#### Tool 3: create_recruitment
**Purpose:** Create a new recruitment posting

**Parameters:**
```typescript
{
  title: string,
  company_name: string,
  location: string,
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship',
  salary_min?: number,
  salary_max?: number,
  description: string,
  requirements: string,
  responsibilities: string,
  benefits?: string,
  application_deadline?: string,
  status?: 'draft' | 'published'
}
```

**Output:** Returns component metadata with success confirmation and new recruitment details

**Display Mode:** Inline

---

#### Tool 4: update_recruitment
**Purpose:** Edit existing recruitment posting

**Parameters:**
```typescript
{
  recruitment_id: number,
  updates: {
    title?: string,
    company_name?: string,
    location?: string,
    employment_type?: string,
    salary_min?: number,
    salary_max?: number,
    description?: string,
    requirements?: string,
    responsibilities?: string,
    benefits?: string,
    application_deadline?: string,
    status?: string
  }
}
```

**Output:** Returns component metadata with updated recruitment

**Display Mode:** Inline

---

#### Tool 5: delete_recruitment
**Purpose:** Remove a recruitment posting

**Parameters:**
```typescript
{
  recruitment_id: number
}
```

**Output:** Returns success confirmation

**Display Mode:** Inline (simple confirmation message)

---

#### Tool 6: publish_recruitment
**Purpose:** Change recruitment status to published

**Parameters:**
```typescript
{
  recruitment_id: number
}
```

**Output:** Returns component metadata with updated recruitment

**Display Mode:** Inline

---

#### Tool 7: get_recruitment_statistics
**Purpose:** Display recruitment analytics and statistics

**Parameters:**
```typescript
{
  date_from?: string,
  date_to?: string
}
```

**Output:** Returns component metadata with statistics dashboard

**Display Mode:** Fullscreen

---

#### Tool 8: list_applications
**Purpose:** View applications for a specific recruitment

**Parameters:**
```typescript
{
  recruitment_id: number,
  status?: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
}
```

**Output:** Returns component metadata with applications list

**Display Mode:** Fullscreen

---

### 2.3 MCP Server Project Structure

```
recruitment-mcp-server/
├── src/
│   ├── index.ts                    # Main MCP server entry
│   ├── tools/
│   │   ├── recruitments.ts         # Recruitment-related tools
│   │   ├── applications.ts         # Application-related tools
│   │   └── statistics.ts           # Statistics tools
│   ├── services/
│   │   └── laravelApiClient.ts     # Laravel API communication
│   ├── types/
│   │   └── recruitment.types.ts    # TypeScript types
│   └── components/
│       ├── RecruitmentList.tsx     # List view component
│       ├── RecruitmentDetail.tsx   # Detail view component
│       ├── RecruitmentForm.tsx     # Create/Edit form component
│       ├── ApplicationsList.tsx    # Applications list component
│       └── StatisticsDashboard.tsx # Statistics dashboard
├── package.json
├── tsconfig.json
└── README.md
```

---

## Part 3: React Components for ChatGPT UI

### 3.1 Component Architecture

All React components run in ChatGPT's sandboxed iframe and communicate via `window.openai` API.

**Common Features:**
- Access to OpenAI globals: `window.openai.data`, `window.openai.setState()`
- Tailwind CSS for styling (ChatGPT provides this)
- Read-only interaction model (actions trigger new ChatGPT turns)

### 3.2 Component Specifications

#### Component 1: RecruitmentList.tsx
**Purpose:** Display paginated list of recruitments

**Props (from tool output):**
```typescript
{
  recruitments: Array<{
    id: number,
    title: string,
    company_name: string,
    location: string,
    employment_type: string,
    salary_range?: string,
    status: string,
    published_at?: string
  }>,
  total: number,
  current_page: number,
  per_page: number
}
```

**Features:**
- Card-based layout
- Status badges (color-coded)
- Click to view details (triggers new ChatGPT message)
- Filters display (status, employment type)

---

#### Component 2: RecruitmentDetail.tsx
**Purpose:** Show comprehensive recruitment information

**Props:**
```typescript
{
  recruitment: {
    id: number,
    title: string,
    company_name: string,
    location: string,
    employment_type: string,
    salary_range?: string,
    description: string,
    requirements: string,
    responsibilities: string,
    benefits?: string,
    application_deadline?: string,
    status: string,
    applications_count?: number,
    created_at: string,
    published_at?: string
  }
}
```

**Features:**
- Structured layout with sections
- Action buttons (Edit, Delete, Publish/Close) that prompt ChatGPT
- Applications summary with link to view applications
- Formatted dates and salary information

---

#### Component 3: RecruitmentForm.tsx
**Purpose:** Confirmation view after create/update operations

**Props:**
```typescript
{
  action: 'created' | 'updated',
  recruitment: {
    id: number,
    title: string,
    company_name: string,
    status: string
  }
}
```

**Features:**
- Success message
- Quick summary of action taken
- Suggestions for next actions

---

#### Component 4: ApplicationsList.tsx
**Purpose:** Display applications for a recruitment

**Props:**
```typescript
{
  recruitment_id: number,
  recruitment_title: string,
  applications: Array<{
    id: number,
    applicant_name: string,
    applicant_email: string,
    status: string,
    applied_at: string
  }>,
  total: number
}
```

**Features:**
- Table layout
- Status filtering
- Click to view application details
- Status update suggestions

---

#### Component 5: StatisticsDashboard.tsx
**Purpose:** Visual recruitment analytics

**Props:**
```typescript
{
  total_recruitments: number,
  by_status: {
    draft: number,
    published: number,
    closed: number,
    filled: number
  },
  by_employment_type: Record<string, number>,
  recent_activity: Array<{
    recruitment_title: string,
    action: string,
    timestamp: string
  }>,
  total_applications: number
}
```

**Features:**
- Visual charts (bar/pie charts using simple SVG or text-based)
- Key metrics cards
- Recent activity timeline
- Date range display

---

## Part 4: Implementation Steps

### Phase 1: Laravel Backend (Week 1-2)

1. **Setup Laravel Project**
   - Install Laravel 10.x
   - Configure database connection
   - Install Laravel Sanctum

2. **Database & Models**
   - Create migrations for recruitments, applications tables
   - Create Eloquent models with relationships
   - Create seeders for test data

3. **API Development**
   - Implement authentication endpoints (Sanctum)
   - Implement RecruitmentController with CRUD operations
   - Implement ApplicationController
   - Implement StatisticsController
   - Create Form Request validators
   - Create API Resources for JSON transformation

4. **Testing & Documentation**
   - Write feature tests for API endpoints
   - Test CORS configuration
   - Document API with Postman/OpenAPI

### Phase 2: MCP Server Development (Week 2-3)

1. **Project Setup**
   - Initialize Node.js TypeScript project
   - Install MCP SDK and dependencies
   - Configure TypeScript and build tools

2. **Laravel API Client**
   - Create axios-based client for Laravel API
   - Implement authentication token management
   - Create service methods for all endpoints

3. **Tool Definitions**
   - Implement all 8 tools (list_recruitments, create_recruitment, etc.)
   - Define input schemas with proper validation
   - Define output templates pointing to React components
   - Test tool invocation with mock data

4. **Resource Registration**
   - Bundle React components as HTML resources
   - Register resources in MCP server
   - Configure component metadata

### Phase 3: React Components (Week 3-4)

1. **Component Development**
   - Create RecruitmentList component
   - Create RecruitmentDetail component
   - Create RecruitmentForm component
   - Create ApplicationsList component
   - Create StatisticsDashboard component

2. **Styling & UX**
   - Apply Tailwind CSS for consistent styling
   - Implement responsive layouts
   - Add loading states and error handling
   - Test in ChatGPT sandbox environment

3. **Integration Testing**
   - Test component data flow from MCP tools
   - Test user interactions triggering ChatGPT prompts
   - Verify all display modes (inline, fullscreen)

### Phase 4: Integration & Testing (Week 4)

1. **End-to-End Testing**
   - Deploy Laravel API to staging server
   - Deploy MCP server
   - Connect MCP server to ChatGPT Developer Mode
   - Test complete workflows:
     - Creating recruitments via natural language
     - Listing and filtering recruitments
     - Updating existing recruitments
     - Viewing applications
     - Checking statistics

2. **User Acceptance Testing**
   - Test conversation flows
   - Verify data consistency between ChatGPT and Laravel
   - Test error handling and edge cases

3. **Documentation**
   - Write deployment guide
   - Create user guide for ChatGPT interactions
   - Document API and MCP tool specifications

---

## Part 5: Sample Interaction Flows

### Flow 1: Creating a Recruitment
```
User: "I need to create a new job posting for a Senior Full Stack Developer"

ChatGPT: "I'll help you create a job posting. Let me gather some information:
- What company is this for?
- Where is the position located?
- What's the employment type (full-time, part-time, contract)?
- What's the salary range?"

User: "It's for TechCorp, remote position, full-time, $120k-$150k"

ChatGPT: [Calls create_recruitment tool with parameters]
[Renders RecruitmentForm component showing success]
"I've created a draft recruitment posting for Senior Full Stack Developer at TechCorp.
Would you like me to add the job description and requirements?"
```

### Flow 2: Listing Recruitments
```
User: "Show me all published job postings"

ChatGPT: [Calls list_recruitments tool with status='published']
[Renders RecruitmentList component showing all published jobs]
"Here are all 12 published recruitments. You can click on any to view details,
or ask me to filter by location, employment type, or search for specific keywords."
```

### Flow 3: Updating a Recruitment
```
User: "Change the salary range for the Senior Developer position to $130k-$160k"

ChatGPT: [Calls list_recruitments with search='Senior Developer' to find the ID]
"I found the Senior Full Stack Developer position (ID: 5). Let me update the salary range."
[Calls update_recruitment tool]
[Renders confirmation]
"Updated! The salary range is now $130,000 - $160,000."
```

---

## Part 6: Technology Stack Summary

### Laravel Backend
- **Framework:** Laravel 10.x
- **Database:** MySQL 8.0+
- **Authentication:** Laravel Sanctum
- **Testing:** PHPUnit
- **Deployment:** Docker/Laravel Forge

### MCP Server
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.x
- **Framework:** MCP SDK
- **HTTP Client:** Axios
- **Build Tool:** esbuild/webpack

### React Components
- **Framework:** React 18
- **Styling:** Tailwind CSS (provided by ChatGPT)
- **State Management:** OpenAI window API
- **Build Tool:** Vite/webpack

### Development Tools
- **Version Control:** Git
- **API Testing:** Postman/Insomnia
- **MCP Testing:** ChatGPT Developer Mode
- **Code Quality:** ESLint, Prettier, PHPStan

---

## Part 7: Security Considerations

### Laravel API Security
1. **Authentication:** All API endpoints require Sanctum token
2. **Authorization:** Policy-based access control for recruitments
3. **Validation:** Strict input validation on all requests
4. **Rate Limiting:** Prevent abuse with Laravel's rate limiter
5. **CORS:** Whitelist only MCP server domain
6. **SQL Injection:** Use Eloquent ORM, avoid raw queries
7. **File Upload:** Validate file types and sizes for resumes

### MCP Server Security
1. **API Credentials:** Store Laravel API token securely (environment variables)
2. **Input Sanitization:** Validate all user inputs before API calls
3. **Error Handling:** Don't expose sensitive error details to ChatGPT
4. **HTTPS:** Enforce encrypted communication with Laravel API

---

## Part 8: Deployment Architecture

```
┌─────────────────┐
│   ChatGPT       │
│   (User)        │
└────────┬────────┘
         │
         │ (Natural Language + Tool Calls)
         │
         ▼
┌─────────────────────────┐
│   MCP Server            │
│   (Node.js + React)     │
│   - Tool Definitions    │
│   - Component Resources │
└────────┬────────────────┘
         │
         │ (HTTP/REST API)
         │
         ▼
┌─────────────────────────┐
│   Laravel API           │
│   (Backend)             │
│   - Recruitment CRUD    │
│   - Authentication      │
└────────┬────────────────┘
         │
         │
         ▼
┌─────────────────────────┐
│   MySQL Database        │
│   - Recruitments        │
│   - Applications        │
│   - Users               │
└─────────────────────────┘
```

---

## Part 9: Next Steps

1. **Confirm Requirements:** Review this plan and confirm all features meet your needs
2. **Setup Development Environment:** Install Laravel, Node.js, MySQL
3. **Create GitHub Repository:** Version control for both Laravel and MCP server
4. **Begin Phase 1:** Start with Laravel backend development
5. **Iterative Development:** Build, test, and refine each phase

---

## Appendix A: Useful Commands

### Laravel Commands
```bash
# Create new Laravel project
composer create-project laravel/laravel recruitment-app

# Run migrations
php artisan migrate

# Create controller
php artisan make:controller Api/RecruitmentController --api

# Create model with migration
php artisan make:model Recruitment -m

# Run tests
php artisan test

# Start development server
php artisan serve
```

### MCP Server Commands
```bash
# Initialize project
npm init -y
npm install @modelcontextprotocol/sdk axios typescript

# Build server
npm run build

# Start server
npm start

# Test with ChatGPT
# (Connect in ChatGPT Developer Mode settings)
```

---

## Appendix B: Sample Laravel Model Code

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recruitment extends Model
{
    protected $fillable = [
        'title', 'company_name', 'location', 'employment_type',
        'salary_min', 'salary_max', 'salary_currency',
        'description', 'requirements', 'responsibilities', 'benefits',
        'application_deadline', 'status', 'created_by', 'published_at'
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'application_deadline' => 'date',
        'published_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'published')
                    ->where(function($q) {
                        $q->whereNull('application_deadline')
                          ->orWhere('application_deadline', '>=', now());
                    });
    }
}
```

---

## Appendix C: Sample MCP Tool Definition

```typescript
// Example: list_recruitments tool
server.tool(
  "list_recruitments",
  {
    status: z.enum(['draft', 'published', 'closed', 'filled']).optional(),
    search: z.string().optional(),
    employment_type: z.string().optional(),
    limit: z.number().default(10),
    page: z.number().default(1)
  },
  async (params) => {
    // Call Laravel API
    const response = await laravelApi.get('/api/recruitments', {
      params: params
    });

    // Return component metadata
    return {
      component: {
        type: 'inline',
        template: 'recruitment-list',
        data: {
          recruitments: response.data.data,
          total: response.data.total,
          current_page: response.data.current_page,
          per_page: response.data.per_page
        }
      }
    };
  }
);
```

---

**End of Plan**
