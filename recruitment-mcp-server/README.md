# Recruitment MCP Server

A Model Context Protocol (MCP) server that provides ChatGPT with recruitment management capabilities, integrating with a Laravel backend API.

## Overview

This MCP server enables ChatGPT to:
- Manage recruitment postings (create, read, update, delete, publish)
- View and manage job applications
- Display recruitment statistics and analytics
- Render interactive React components in ChatGPT's UI

## Architecture

```
ChatGPT (User)
    ↓ (Natural Language + Tool Calls)
MCP Server (Node.js + React Components)
    ↓ (HTTP/REST API)
Laravel Backend API
    ↓
MySQL Database
```

## Features

### 8 MCP Tools

1. **list_recruitments** - List all recruitments with filters
2. **get_recruitment_details** - Get detailed recruitment information
3. **create_recruitment** - Create a new recruitment posting
4. **update_recruitment** - Update an existing recruitment
5. **delete_recruitment** - Delete a recruitment
6. **publish_recruitment** - Publish a recruitment (change status)
7. **get_recruitment_statistics** - View analytics dashboard
8. **list_applications** - View applications for a recruitment

### 5 React Components

1. **RecruitmentList** - Paginated list view (inline display)
2. **RecruitmentDetail** - Detailed recruitment view (fullscreen)
3. **RecruitmentForm** - Success confirmation for create/update
4. **ApplicationsList** - Applications table (fullscreen)
5. **StatisticsDashboard** - Analytics dashboard (fullscreen)

## Prerequisites

- Node.js 18 or higher
- Laravel Backend API running (see `recruitment-app` directory)
- Laravel Sanctum API token

## Installation

1. **Clone the repository**

```bash
cd recruitment-mcp-server
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
LARAVEL_API_URL=http://localhost:8000
LARAVEL_API_TOKEN=your-sanctum-token-here
MCP_SERVER_NAME=recruitment-mcp-server
MCP_SERVER_VERSION=1.0.0
```

To get a Laravel Sanctum token:
- Log in to your Laravel application
- Create an API token via the `/api/auth/login` endpoint
- Use the returned token in the `.env` file

4. **Build the project**

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle React components into HTML resources

5. **Test the server**

```bash
npm start
```

## Development

### Development Mode

Run the server in watch mode with auto-reload:

```bash
npm run dev
```

### Project Structure

```
recruitment-mcp-server/
├── src/
│   ├── index.ts                    # Main MCP server entry point
│   ├── tools/
│   │   ├── recruitments.ts         # Recruitment-related tools
│   │   ├── applications.ts         # Application-related tools
│   │   └── statistics.ts           # Statistics tools
│   ├── services/
│   │   └── laravelApiClient.ts     # Laravel API communication
│   ├── types/
│   │   ├── recruitment.types.ts    # TypeScript type definitions
│   │   └── global.d.ts             # Global type declarations
│   └── components/
│       ├── RecruitmentList.tsx     # List view component
│       ├── RecruitmentDetail.tsx   # Detail view component
│       ├── RecruitmentForm.tsx     # Create/Edit confirmation
│       ├── ApplicationsList.tsx    # Applications list component
│       └── StatisticsDashboard.tsx # Statistics dashboard
├── dist/                           # Compiled output
│   ├── index.js                    # Compiled server
│   └── components/                 # Bundled HTML components
├── package.json
├── tsconfig.json
├── build.js                        # Component bundling script
└── README.md
```

## Connecting to ChatGPT

### Option 1: Local Development (ChatGPT Desktop App)

1. Open ChatGPT Desktop App settings
2. Go to "Developer" section
3. Enable "Developer Mode"
4. Add a new MCP server:
   - **Name**: Recruitment Manager
   - **Command**: `node`
   - **Arguments**: `["/full/path/to/recruitment-mcp-server/dist/index.js"]`
5. Restart ChatGPT

### Option 2: Production Deployment

1. Deploy the MCP server to a production server
2. Configure ChatGPT to connect via the deployed URL
3. Ensure proper authentication and security measures

## Usage Examples

Once connected to ChatGPT, you can interact naturally:

### Create a Recruitment

```
User: "Create a new job posting for a Senior Full Stack Developer at TechCorp,
       remote position, full-time, $120k-$150k"

ChatGPT: [Calls create_recruitment tool]
         [Renders RecruitmentForm component with success message]
```

### List Recruitments

```
User: "Show me all published job postings"

ChatGPT: [Calls list_recruitments with status='published']
         [Renders RecruitmentList component showing all published jobs]
```

### View Details

```
User: "Show me details for recruitment #5"

ChatGPT: [Calls get_recruitment_details with id=5]
         [Renders RecruitmentDetail component in fullscreen]
```

### Update a Recruitment

```
User: "Change the salary range for recruitment #5 to $130k-$160k"

ChatGPT: [Calls update_recruitment tool]
         [Renders confirmation]
```

### View Statistics

```
User: "Show me recruitment statistics"

ChatGPT: [Calls get_recruitment_statistics]
         [Renders StatisticsDashboard with charts and metrics]
```

### View Applications

```
User: "Show me applications for recruitment #5"

ChatGPT: [Calls list_applications with recruitment_id=5]
         [Renders ApplicationsList component]
```

## API Client Configuration

The Laravel API client (`src/services/laravelApiClient.ts`) handles:

- Authentication via Laravel Sanctum tokens
- Error handling and retries
- Request/response transformation
- Timeout management (10 seconds default)

All API endpoints are typed using TypeScript interfaces defined in `src/types/recruitment.types.ts`.

## Component Development

React components are built using:

- **React 18** - Component library
- **Tailwind CSS** - Styling (provided by ChatGPT sandbox)
- **window.openai API** - ChatGPT integration

Components are bundled as self-contained HTML files with all dependencies included.

### Component Props

Components receive data via `window.openai.data`:

```tsx
const props = window.openai?.data || {};
```

### Triggering ChatGPT Actions

Components can trigger new ChatGPT turns by updating state:

```tsx
if (window.openai) {
  window.openai.setState({ selectedRecruitmentId: id });
}
```

## Testing

### Testing Tools

You can test individual tools using the MCP inspector:

```bash
npm run inspect
```

This will start the server in inspection mode where you can manually trigger tools.

### Testing with Mock Data

The Laravel backend should have seeders to populate test data. Run:

```bash
cd ../recruitment-app
php artisan db:seed
```

## Troubleshooting

### "Laravel API is unreachable"

- Check that the Laravel backend is running: `php artisan serve`
- Verify `LARAVEL_API_URL` in `.env` is correct
- Test the API directly: `curl http://localhost:8000/api/recruitments`

### "LARAVEL_API_TOKEN environment variable is required"

- Ensure `.env` file exists in the root directory
- Verify `LARAVEL_API_TOKEN` is set
- Generate a new token from Laravel if needed

### Components Not Rendering

- Run `npm run build` to rebuild components
- Check that component HTML files exist in `dist/components/`
- Verify component URIs match in `src/index.ts` and tool responses

### Tool Validation Errors

- Check that tool arguments match the schema in `src/tools/*.ts`
- Ensure Zod schemas are correctly defined
- Verify data types match TypeScript interfaces

## Security Considerations

1. **API Token Security**
   - Never commit `.env` file to version control
   - Rotate API tokens regularly
   - Use environment-specific tokens

2. **Input Validation**
   - All tool inputs are validated using Zod schemas
   - Laravel backend performs additional validation

3. **Error Handling**
   - Errors are caught and sanitized before showing to users
   - Sensitive information is not exposed in error messages

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License

## Support

For issues or questions:
- Check the Laravel backend logs
- Review MCP server console output
- Test API endpoints directly
- Verify environment configuration

## Related Documentation

- [MCP SDK Documentation](https://modelcontextprotocol.io)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
