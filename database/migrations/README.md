\# Database Migrations



\## Running the Migration



To apply the URL-based projects migration:



1\. Log into your Neon database console at https://console.neon.tech

2\. Select your database

3\. Go to the SQL Editor

4\. Copy and paste the contents of `001\_add\_url\_based\_projects.sql`

5\. Run the SQL



\## Migration: 001\_add\_url\_based\_projects.sql



This migration adds support for URL-based project routing:



\- Creates `projects` table

\- Adds `project\_id` foreign key to `json\_submissions`

\- Creates necessary indexes

\- Sets up default project

\- Migrates existing data to default project



\## After Running Migration



Your API will support these new endpoints:



\- `POST /api/projects` - Create new project

\- `GET /api/projects` - List all projects

\- `POST /api/projects/{project-name}/data` - Submit data to specific project

\- `GET /api/projects/{project-name}/data` - Retrieve data from specific project

