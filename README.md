================================================================================
                        PHISHAWARE - APPLICATION DOCUMENTATION
================================================================================

PROJECT NAME: PhishAware
VERSION: 0.0.0
TYPE: Web Application (Full-Stack)
PURPOSE: Phishing Awareness Training Platform

================================================================================
                              PROJECT OVERVIEW
================================================================================

PhishAware is a comprehensive phishing awareness training platform designed to 
educate employees and administrators about phishing threats through interactive 
campaigns, real-time feedback mechanisms, and AI-powered support tools.

The application enables organizations to:
- Create and manage phishing awareness campaigns
- Track employee responses and generate detailed reports
- Provide real-time support through an AI-powered chatbot
- Collect feedback to improve security awareness

================================================================================
                              KEY FEATURES
================================================================================

1. LANDING PAGE
   - Public-facing page with feature highlights
   - Information about the platform and its benefits
   - Call-to-action for login

2. AUTHENTICATION SYSTEM
   - Secure login for Admins and Employees
   - Role-based access control
   - Password encryption using bcryptjs

3. ADMIN DASHBOARD
   - Create phishing campaigns
   - Design email templates
   - Send campaigns to employees
   - View comprehensive reports and analytics
   - Track campaign performance metrics

4. EMPLOYEE DASHBOARD
   - View assigned campaigns
   - Provide feedback on phishing awareness
   - Access training materials
   - Track personal progress

5. CHATBOT
   - AI-powered chatbot using Google Gemini API
   - Real-time assistance and guidance
   - Answer questions about phishing and security awareness

6. FEEDBACK SYSTEM
   - Collect employee feedback
   - Monitor engagement and learning outcomes

================================================================================
                              TECHNOLOGY STACK
================================================================================

FRONTEND:
  - React 19.2.6 (UI Framework)
  - Vite 8.0.12 (Build Tool & Dev Server)
  - React Router DOM 7.9.6 (Client-side Routing)
  - Bootstrap 5.3.8 (CSS Framework)
  - React Icons 5.6.0 (Icon Library)
  - React Markdown 10.1.0 (Markdown Rendering)
  - React Simple WYSIWYG 3.4.1 (Rich Text Editor)

BACKEND:
  - Node.js with Express 5.1.0 (REST API Server)
  - MySQL 3.15.3 (Database)
  - Nodemailer 7.0.12 (Email Messaging)
  - Twilio 5.11.1 (SMS Messaging)
  - Google Generative AI 0.24.1 (Chatbot AI)
  - CORS 2.8.5 (Cross-Origin Request Handling)
  - dotenv 17.4.2 (Environment Configuration)

DEPLOYMENT:
  - Vercel (Frontend Hosting)
  - Vercel Speed Insights & Analytics

DEVELOPMENT TOOLS:
  - ESLint (Code Linting)
  - Testing Library (Component Testing)
  - Nodemon (Auto-reload for Backend Development)

================================================================================
                              PROJECT STRUCTURE
================================================================================

my-fishapp/
├── client/                          # Frontend Application
│   ├── src/
│   │   ├── App.jsx                 # Main App Component
│   │   ├── App.css                 # App Styling
│   │   ├── main.jsx                # Entry Point
│   │   ├── index.css               # Global Styles
│   │   ├── components/
│   │   │   ├── Frontend/           # React Components
│   │   │   │   ├── homePage.jsx           # Landing Page
│   │   │   │   ├── loginPage.jsx          # Login Component
│   │   │   │   ├── adminDashboard.jsx     # Admin Interface
│   │   │   │   ├── employeeDashboard.jsx  # Employee Interface
│   │   │   │   ├── chatBot.jsx            # AI Chatbot
│   │   │   │   ├── feedBack.jsx           # Feedback Component
│   │   │   │   ├── featurePage.jsx        # Features Overview
│   │   │   │   ├── aboutPage.jsx          # About Section
│   │   │   │   ├── AnimatedPage.jsx       # Animation Effects
│   │   │   │   ├── SiteNavbar.jsx         # Navigation Bar
│   │   │   │   ├── Reveal.jsx             # Reveal Component
│   │   │   │   └── RouteFallback.jsx      # 404 Page
│   │   │   ├── Resource/            # Reusable Resources
│   │   │   └── Styling/             # CSS Modules
│   │   │       ├── adminDashboard.css
│   │   │       ├── animations.css
│   │   │       ├── chatBot.css
│   │   │       ├── employeeDashboard.css
│   │   │       ├── homePage.css
│   │   │       └── login.css
│   │   └── seo/                     # SEO Configuration
│   │       ├── seoConfig.js
│   │       └── usePageSeo.js
│   ├── public/                      # Static Files
│   │   ├── _redirects               # Vercel Redirects
│   │   ├── robots.txt               # SEO Robots File
│   │   └── sitemap.xml              # SEO Sitemap
│   ├── vite.config.js               # Vite Configuration
│   ├── vercel.json                  # Vercel Deployment Config
│   ├── package.json                 # Frontend Dependencies
│   └── index.html                   # HTML Entry Point
│
├── server/                          # Backend Application
│   ├── server.js                    # Express Server Entry
│   ├── db.js                        # Database Configuration
│   ├── package.json                 # Backend Dependencies
│   ├── API/                         # API Endpoints
│   │   ├── authApi.js              # Authentication Routes
│   │   ├── campaignCreationApi.js   # Campaign Management
│   │   ├── sendCampaignApi.js       # Campaign Distribution
│   │   └── reportCreationApi.js     # Report Generation
│   └── utils/
│       └── messaging.js             # Email & SMS Utilities
│
├── database/                        # Database Files
├── eslint.config.js                # ESLint Configuration
├── vite.config.js                  # Root Vite Config
├── package.json                    # Root Package Config
└── README.md                        # Project README

================================================================================
                              API ENDPOINTS
================================================================================

AUTHENTICATION API (authApi.js)
  - POST /api/auth/login             # User Login
  - POST /api/auth/register          # User Registration
  - POST /api/auth/logout            # User Logout
  - GET /api/auth/verify             # Verify Token

CAMPAIGN CREATION API (campaignCreationApi.js)
  - POST /api/campaigns/create       # Create Campaign
  - GET /api/campaigns               # List All Campaigns
  - GET /api/campaigns/:id           # Get Campaign Details
  - PUT /api/campaigns/:id           # Update Campaign
  - DELETE /api/campaigns/:id        # Delete Campaign
  - POST /api/campaigns/templates    # Create Template

SEND CAMPAIGN API (sendCampaignApi.js)
  - POST /api/campaigns/:id/send     # Send Campaign to Employees
  - POST /api/campaigns/:id/email    # Send via Email
  - POST /api/campaigns/:id/sms      # Send via SMS

REPORT CREATION API (reportCreationApi.js)
  - GET /api/reports                 # Get All Reports
  - GET /api/reports/:id             # Get Report Details
  - POST /api/reports/generate       # Generate New Report
  - GET /api/reports/campaign/:id    # Get Campaign Report
  - GET /api/reports/employee/:id    # Get Employee Report

MESSAGING UTILITIES (messaging.js)
  - Email Delivery via Nodemailer
  - SMS Delivery via Twilio
  - Template-based Message Generation

================================================================================
                              INSTALLATION & SETUP
================================================================================

PREREQUISITES:
  - Node.js (v14 or higher)
  - npm or yarn package manager
  - MySQL Database
  - Environment Variables (.env file)

INSTALLATION STEPS:

1. Install Root Dependencies:
   npm install

2. Install Client Dependencies:
   cd client
   npm install

3. Install Server Dependencies:
   cd ../server
   npm install

4. Configure Environment Variables:
   Create a .env file in the server/ directory with:
   - DATABASE_HOST
   - DATABASE_USER
   - DATABASE_PASSWORD
   - DATABASE_NAME
   - JWT_SECRET
   - NODEMAILER_EMAIL
   - NODEMAILER_PASSWORD
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - GOOGLE_API_KEY (for Gemini AI)

================================================================================
                              RUNNING THE APPLICATION
================================================================================

DEVELOPMENT MODE:

1. Run Both Frontend and Backend (Recommended):
   npm run dev:all

2. Run Only Backend Server:
   npm run server
   (with auto-reload: npm run server-dev)

3. Run Only Frontend:
   cd client
   npm run dev

4. Access the Application:
   Frontend: http://localhost:5173 (or as shown by Vite)
   Backend: http://localhost:3001 (or configured port)

PRODUCTION BUILD:

1. Build Frontend:
   npm run build

2. Preview Production Build:
   npm run preview

3. Deploy to Vercel:
   - Push to GitHub repository
   - Connect repository to Vercel
   - Configure environment variables
   - Auto-deploy on push

================================================================================
                              COMPONENT DESCRIPTIONS
================================================================================

================================================================================
                              DEPLOYMENT
================================================================================

The application is configured for Vercel deployment:

1. Frontend is deployed as a Vercel serverless frontend
2. Backend can be deployed as a Vercel serverless function
3. Database is hosted externally (MySQL)
4. Email and SMS services integrated via Nodemailer and Twilio

DEPLOYMENT CHECKLIST:
  ☐ Configure all environment variables
  ☐ Test all API endpoints
  ☐ Verify database connectivity
  ☐ Set up email service credentials
  ☐ Configure Twilio for SMS
  ☐ Set Google API key for Gemini AI
  ☐ Test on staging environment
  ☐ Configure domain name
  ☐ Enable HTTPS
  ☐ Set up monitoring and logging

================================================================================
                              DEVELOPMENT NOTES
================================================================================

1. CORS CONFIGURATION
   - Currently allows localhost and Vercel origins
   - Modify origin function in server.js for additional domains

2. API BASE URL
   - Update in client components to match backend server URL
   - Use environment variables for flexibility

3. DATABASE CONNECTION
   - Ensure MySQL server is running before starting backend
   - Connection pool configured for performance

4. NODEMAILER SETUP
   - Use app-specific password for Gmail
   - Configure SMTP settings in .env

5. TWILIO SETUP
   - Obtain SID and Auth Token from Twilio console
   - Set message limits to avoid unexpected charges

6. GOOGLE GENERATIVE AI
   - Get API key from Google Cloud Console
   - Enable Generative AI API
   - Implement rate limiting for API calls

================================================================================
                              TROUBLESHOOTING
================================================================================

1. PORT ALREADY IN USE
   - Change port in server.js or vite.config.js
   - Kill process using the port

2. DATABASE CONNECTION ERRORS
   - Verify MySQL server is running
   - Check .env credentials
   - Ensure database exists

3. CORS ERRORS
   - Check origin in server.js CORS config
   - Verify frontend is on allowed domain

4. EMAIL NOT SENDING
   - Verify Nodemailer credentials
   - Check email provider settings
   - Enable "Less secure apps" if using Gmail

5. BUILD ERRORS
   - Clear node_modules and reinstall: rm -rf node_modules && npm install
   - Check Node.js version compatibility
   - Clear Vite cache

================================================================================
                              FUTURE ENHANCEMENTS
================================================================================

1. Two-Factor Authentication (2FA)
2. Advanced Analytics Dashboard
3. Machine Learning-based Phishing Detection
4. Mobile Application
5. Multi-language Support
6. Integration with HR Systems
7. Automated Remedial Training
8. Compliance Reporting
9. API Rate Limiting
10. Webhook Support for Third-party Integrations

================================================================================
                              SUPPORT & CONTACT
================================================================================

For issues, questions, or feature requests:
- Review the README.md for quick start guide
- Check existing issues on the project repository
- Contact the development team

================================================================================
                        END OF DOCUMENTATION
================================================================================

================================================================================
                              DATABASE SCHEMA
================================================================================

Expected Database Tables:

1. users
   - id, username, email, password_hash, role, created_at, updated_at

2. campaigns
   - id, name, description, template_id, created_by, created_at, sent_at

3. campaign_templates
   - id, name, subject, body, created_by, created_at

4. campaign_recipients
   - id, campaign_id, user_id, response_status, response_time

5. reports
   - id, campaign_id, generated_by, data (JSON), created_at

6. feedback
   - id, user_id, campaign_id, rating, comment, created_at

================================================================================
                              SECURITY FEATURES
================================================================================

1. PASSWORD ENCRYPTION
   - bcryptjs for secure password hashing

2. CORS PROTECTION
   - Configured to allow only Vercel and localhost origins

3. JWT AUTHENTICATION
   - Token-based authentication for API endpoints

4. ROLE-BASED ACCESS CONTROL
   - Admin and Employee roles with different permissions

5. ENVIRONMENT VARIABLES
   - Sensitive data stored in .env files (not in repository)

6. SQL QUERY SAFETY
   - Parameterized queries to prevent SQL injection
