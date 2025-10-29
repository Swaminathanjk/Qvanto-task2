# Insurance Policy Approval System

A multi-step insurance policy approval system built with the MERN stack, featuring role-based access control, approval workflows, and fraud detection simulation.

## Features

### Core Functionality
- **Policy CRUD Operations**: Create, read, update, and delete insurance policies
- **Role-Based Access Control**: Three user roles (Creator, Underwriter, Manager)
- **Approval Workflow**: Two-step approval process (Underwriter → Manager)
- **Fraud Check Simulation**: Random AI logic to simulate fraud detection
- **Approval Logs**: Complete audit trail of all approval actions
- **Real-time Notifications**: Console-based notifications for workflow events

### User Roles
- **Creator**: Can create, edit (draft only), and submit policies
- **Underwriter**: Can approve/reject policies in first approval step
- **Manager**: Can approve/reject policies in final approval step

### Policy Workflow
1. Creator creates a policy (draft status)
2. Automatic fraud check is performed (80% pass rate)
3. If fraud check passes, policy moves to "Pending Underwriter" status
4. Underwriter reviews and approves/rejects
5. If approved, policy moves to "Pending Manager" status
6. Manager performs final review and approval/rejection
7. Policy reaches final status (Approved/Rejected)

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Vite, Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)
- **Notifications**: React Toastify
- **Styling**: Tailwind CSS with custom components

## Project Structure

```
├── backend/
│   ├── models/
│   │   ├── User.js          # User model with role-based authentication
│   │   └── Policy.js        # Policy model with approval workflow
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── policies.js      # Policy CRUD and approval routes
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── server.js            # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx           # Authentication component
│   │   │   ├── Dashboard.jsx       # Main policy dashboard
│   │   │   ├── PolicyForm.jsx      # Create/edit policy form
│   │   │   ├── PolicyDetails.jsx   # Policy details and actions
│   │   │   └── Header.jsx          # Navigation header
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Authentication context
│   │   ├── services/
│   │   │   └── api.js              # API service layer
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # App entry point
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/insurance-policy-system
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### Getting Started

1. **Create Demo Users**: On the login page, click "Create Demo Users" to set up test accounts
2. **Login**: Use one of the demo accounts:
   - Creator: `creator@example.com` / `password123`
   - Underwriter: `underwriter@example.com` / `password123`
   - Manager: `manager@example.com` / `password123`

### Testing the Workflow

1. **As a Creator**:
   - Login with creator credentials
   - Create a new policy
   - Edit the policy (if in draft status)
   - Submit the policy for approval

2. **As an Underwriter**:
   - Login with underwriter credentials
   - View policies pending your approval
   - Approve or reject policies

3. **As a Manager**:
   - Login with manager credentials
   - View policies pending final approval
   - Approve or reject policies

### Console Notifications

The system provides real-time notifications in the browser console for:
- Policy creation and updates
- Fraud check results
- Approval workflow transitions
- User actions and status changes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/create-demo-users` - Create demo users

### Policies
- `GET /api/policies` - Get all policies (filtered by role)
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create new policy
- `PUT /api/policies/:id` - Update policy (creator only, draft only)
- `DELETE /api/policies/:id` - Delete policy (creator only, draft only)
- `POST /api/policies/:id/submit` - Submit policy for approval
- `POST /api/policies/:id/approve` - Approve/reject policy

## Architecture Notes

### Backend Architecture
- **MVC Pattern**: Models, routes, and middleware separation
- **JWT Authentication**: Stateless authentication with role-based access
- **MongoDB**: Document-based storage for flexible policy data
- **Middleware**: Request validation and authentication layers

### Frontend Architecture
- **Component-Based**: Reusable React components
- **Context API**: Global state management for authentication
- **Service Layer**: Centralized API communication
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Security Features
- Password hashing with bcrypt
- JWT token expiration
- Role-based route protection
- Input validation and sanitization

### Fraud Detection Simulation
- Random boolean generator (80% pass rate)
- Automatic policy status updates
- Console logging for transparency
- Easy to replace with real fraud detection API

## Development Notes

### Adding New Features
1. **New User Roles**: Update the User model and middleware
2. **Additional Approval Steps**: Modify the Policy model and workflow logic
3. **Enhanced Fraud Detection**: Replace the random generator with real API calls
4. **Email Notifications**: Add email service integration
5. **File Attachments**: Extend Policy model for document storage

### Testing
- Use the demo users for testing different scenarios
- Check browser console for workflow notifications
- Test role-based access restrictions
- Verify approval workflow transitions

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running locally or update connection string
2. **CORS Errors**: Check that backend is running on port 5000
3. **Authentication Issues**: Clear localStorage and re-login
4. **Policy Creation Fails**: Check fraud check simulation in console

### Debug Mode
- Enable detailed logging in backend routes
- Check browser network tab for API errors
- Monitor console for notification messages

