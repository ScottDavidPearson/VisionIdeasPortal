# Vision Ideas Portal

A comprehensive idea management system with public submission portal and admin dashboard for product teams.

## 🚀 Features

### Public Portal
- ✅ **Idea Submission**: Submit ideas with rich descriptions and file attachments
- ✅ **Dynamic Categories**: Product suites and modules configured by admin
- ✅ **Voting System**: Community voting on submitted ideas
- ✅ **Enhanced Links**: Automatic detection and friendly display of document links
- ✅ **File Uploads**: Support for PDFs, images, and documents
- ✅ **Real-time Updates**: Live refresh of ideas and voting

### Admin Dashboard
- ✅ **Kanban Board**: Drag-and-drop status management
- ✅ **Advanced Filtering**: Filter by suite, module, status, source
- ✅ **Idea Management**: Edit, promote, and delete ideas
- ✅ **Internal Data**: Effort estimation, requirements, features, use cases
- ✅ **Roadmap Reports**: Professional modal reports with print functionality
- ✅ **Settings Management**: Configure product suites, modules, and statuses
- ✅ **Azure DevOps Integration**: Promote ideas to Epic/Feature work items

### Enhanced Link Processing
- ✅ **Microsoft Loop**: Automatic detection and friendly naming
- ✅ **SharePoint/OneDrive**: Document name extraction
- ✅ **Markdown Links**: `[Display Text](URL)` support
- ✅ **Multiple Platforms**: Google Drive, Dropbox, Box, Confluence support

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express.js**
- **JWT Authentication** with bcrypt
- **Document-based Storage** using custom DocumentStore
- **File Upload** with Multer
- **Azure DevOps API** integration

### Frontend
- **React.js** with **Material-UI**
- **React Beautiful DnD** for Kanban functionality
- **Axios** for API communication
- **React Dropzone** for file uploads

## 📦 Setup Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### 3. Start the Development Servers

```bash
# Start backend server (port 5000)
npm start
# OR use the batch file
start.bat

# Start frontend server (port 3001) - in a new terminal
cd client && npm start
# OR use the batch file
start_react.bat
```

The application will be available at:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000

## 🔐 Default Login

- **Username**: `admin`
- **Password**: `admin123`

## 📋 API Endpoints

### Public Endpoints
- `GET /api/ideas` - Get all ideas with filtering
- `POST /api/ideas` - Submit new idea
- `POST /api/ideas/:id/vote` - Vote on idea
- `GET /api/categories` - Get configured categories
- `GET /api/sources` - Get idea sources
- `GET /api/stats` - Get portal statistics

### Admin Endpoints (Authentication Required)
- `PUT /api/admin/ideas/:id/status` - Update idea status
- `PUT /api/admin/ideas/:id/internal` - Update internal data
- `POST /api/admin/ideas/:id/promote` - Promote to Azure DevOps
- `DELETE /api/admin/ideas/:id` - Delete idea
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

### File Upload
- `POST /api/upload` - Upload files for ideas

## 🎯 Key Features Explained

### Dynamic Category System
- Admin configures **Product Suites** and **Modules** in settings
- Categories automatically sync across all views
- Public submission form uses configured categories
- Kanban filters use same category structure

### Enhanced Link Processing
The system automatically processes URLs in descriptions and technical requirements:

```
Raw URL: https://company.sharepoint.com/sites/project/document.docx
Displays as: document.docx (clickable)

Markdown: [Requirements Doc](https://long-url-here)
Displays as: Requirements Doc (clickable)

Microsoft Loop: https://loop.microsoft.com/...
Displays as: Microsoft Loop Document (clickable)
```

### Kanban Workflow
1. **Submitted** → Ideas start here
2. **Under Review** → Admin reviewing
3. **Approved** → Ready for development
4. **In Progress** → Currently being worked on
5. **Completed** → Finished implementation
6. **Declined** → Not moving forward

### Report Generation
- **Modal-based reports** instead of PDF generation
- **Filter synchronization** between Kanban and reports
- **Professional formatting** with summary statistics
- **Print functionality** for PDF creation (Ctrl+P)

## 🔧 Configuration

### Product Suites and Modules
Configure in Admin Settings:
- **SCM Suite**: WMS, OMS, Sourcing, Demand, Misc
- **Retail Management Suite**: Merchandising, POS, Omni, WMS, Planning, TMP
- **Foundation**: Infrastructure (custom example)

### Azure DevOps Integration
Set up in Admin Settings → Azure DevOps tab:
- Organization URL
- Project name
- Personal Access Token
- Area Path and Iteration Path

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper JWT secret
3. Set up file storage location
4. Configure CORS origins
5. Set up SSL/TLS certificates
6. Configure Azure DevOps integration

## 🐛 Troubleshooting

### Common Issues
1. **Categories not syncing**: Restart server after settings changes
2. **Links not processing**: Check browser console for LinkifiedText logs
3. **Delete not working**: Ensure server restart after adding delete endpoint
4. **Report filters empty**: Verify categories API is returning data

### Debug Mode
Enable debug logging in LinkifiedText component to troubleshoot link processing issues.

## 📝 License

This project is for internal use and demonstration purposes.

---

**Vision Ideas Portal** - Complete idea management system with public submission, admin dashboard, and Azure DevOps integration.
