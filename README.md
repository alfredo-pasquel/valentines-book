# Valentine Journal - README

## Overview
Valentine Journal is a private shared journal app built using a **React Single Page Application (SPA)** for the frontend and an **Express.js backend** connected to a **MongoDB Atlas** NoSQL database. The app provides a **real-time shared journaling experience**, a **calendar with event tracking**, and a **photo gallery with AWS S3-based image uploads**.

This app was designed as a gift but has the potential for commercialization.

---

## Features
- **Animated book interface** with interactive page-turning effects.
- **Real-time collaborative journaling** with color-coded typing for each user.
- **Calendar with monthly event summaries** and journal-linked dates.
- **Photo gallery with AWS S3 storage** and dynamic image retrieval.
- **Authentication system** with JWT-based security.
- **Private access** restricted to specific users with a PIN-protected registration.
- **Material-UI and TailwindCSS styling** for a polished UI.
- **Framer Motion animations** for a smooth user experience.

---

## Frontend
### Tech Stack
- **React** (with hooks and context management)
- **React Router** for navigation
- **Framer Motion** for animations
- **Material-UI** (MUI) for components
- **TailwindCSS** for styling
- **Axios** for API communication
- **React Calendar** for date selection

### Setup
1. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. Create an `.env` file in the `frontend` directory with:
   ```sh
   REACT_APP_API_BASE_URL=https://your-backend-url.com/api
   ```
3. Start the frontend:
   ```sh
   npm run dev
   ```

### Folder Structure
```
frontend/
│── src/
│   ├── components/
│   │   ├── Auth.jsx         # Login and Register
│   │   ├── Calendar.jsx     # Calendar interface
│   │   ├── Journal.jsx      # Journal UI with dynamic page-turning
│   │   ├── Gallery.jsx      # Image gallery
│   │   ├── BookCover.jsx    # Book cover animation
│   │   └── App.jsx          # Main application entry point
│   ├── assets/              # Static images and styles
│   ├── styles/              # Custom CSS stylesheets
│   ├── utils/               # Utility functions
│   ├── App.css              # Global styles
│   └── index.js             # React root
│── public/
│── package.json
│── .env
└── README.md
```

---

## Backend
### Tech Stack
- **Node.js** (Express.js framework)
- **MongoDB Atlas** (NoSQL database)
- **Mongoose** (ODM for MongoDB)
- **JWT Authentication** (jsonwebtoken & bcrypt)
- **AWS SDK** for S3 image storage
- **Multer** for handling image uploads
- **Dotenv** for environment variables

### Setup
1. Install dependencies:
   ```sh
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend` directory with:
   ```sh
   MONGO_URI=your-mongodb-uri
   JWT_SECRET=your-secret-key
   AWS_REGION=your-aws-region
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   BUCKET_NAME=your-s3-bucket-name
   ```
3. Start the backend:
   ```sh
   npm run start
   ```

### API Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Register a user with a secret PIN |
| POST | `/api/auth/login` | Authenticate a user and return a JWT |
| GET | `/api/journal?date=YYYY-MM-DD` | Fetch a journal entry for a given date |
| POST | `/api/journal` | Create or update a journal entry |
| GET | `/api/calendar?date=YYYY-MM-DD` | Fetch events for a specific date |
| POST | `/api/calendar` | Create a new calendar event |
| DELETE | `/api/calendar/:id` | Delete a calendar event |
| GET | `/api/gallery` | Fetch all gallery images |
| POST | `/api/gallery/upload` | Upload an image to S3 |
| DELETE | `/api/gallery/:id` | Delete an image |

### Folder Structure
```
backend/
│── models/
│   ├── User.js             # User schema
│   ├── JournalEntry.js     # Journal entry schema
│   ├── CalendarEntry.js    # Calendar entry schema
│   ├── GalleryImage.js     # Gallery image schema
│── routes/
│   ├── auth.js             # Authentication routes
│   ├── journal.js          # Journal API endpoints
│   ├── calendar.js         # Calendar API endpoints
│   ├── gallery.js          # Gallery API endpoints
│── utils/
│   ├── authMiddleware.js   # Authentication middleware
│── server.js               # Express server
│── .env                    # Environment variables
│── package.json
│── README.md
```

---

## Security Considerations
- **JWT-based authentication** ensures secure access to protected routes.
- **CORS enabled** for secure cross-origin requests.
- **Secret PIN registration** ensures only authorized users can create accounts.
- **AWS S3 private storage** prevents unauthorized access to images.

---

## Deployment
The app can be deployed using **Netlify** for the frontend and **Render** for the backend.

### Steps:
1. Deploy the frontend on Netlify:
   - Connect the frontend repo to Netlify.
   - Set `REACT_APP_API_BASE_URL` as an environment variable.
   - Deploy.

2. Deploy the backend on Render:
   - Connect the backend repo to Render.
   - Add all `.env` variables.
   - Deploy.

---

## Future Enhancements
- Add real-time WebSocket updates for collaborative journaling.
- Implement offline support for editing and syncing.
- Introduce AI-powered journal summaries.

---

## Author
Developed with ❤️ by Alfredo Pasquel.

