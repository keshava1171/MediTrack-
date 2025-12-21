# MediTrack Pro

MediTrack Pro is a full-stack healthcare and biomedical device monitoring system. It allows patients, doctors, and admins to manage devices, monitor real-time health data, chat live, and manage medical reports.

## Tech Stack

- **Frontend**: ReactJS (Vite), Redux Toolkit, TailwindCSS
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: 
  - **MongoDB**: Primary (Users, Chat, Reports, Vitals)
  - **PostgreSQL**: Secondary (Admin Inventory - Optional/Non-blocking)
- **Real-time**: Socket.IO (Alerts, Chat, Vitals)
- **Auth**: Session-based (express-session) + MongoDB Store
- **File Handling**: Native `fs` streams + `zlib` compression

## Features

1.  **Authentication**: Secure login/register using MongoDB & Sessions.
2.  **Real-time Monitoring**: Simulated heart rate/BP streaming to dashboard via Socket.IO.
3.  **Live Chat**: Real-time communication between Doctors and Patients.
4.  **Medical Reports**: Upload and compress medical files (PDFs/Images) using Node.js streams.
5.  **Responsive Design**: Modern UI built with TailwindCSS.

## Prerequisites

- Node.js (v16+)
- MongoDB (Running locally on port 27017)
- PostgreSQL (Optional - server will skip if not found)

## Setup Instructions

1. **Clone/Navigate to Project Root**
   ```bash
   cd "d:/PERSONAL/LPU/Sem 5 Subjects/MERN"
   ```

2. **Server Setup**
   ```bash
   cd server
   npm install
   # Configure .env file if needed
   npm run dev
   ```
   Server runs on `http://localhost:5000`.

3. **Client Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Client runs on `http://localhost:5173`.

## API Endpoints

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Reports**
  - `POST /api/reports`: Upload & Compress file.
  - `GET /api/reports`: List files.
  - `GET /api/reports/:id/download`: Download & Decompress.

## React Hooks Used
- `useState`, `useEffect`: General state.
- `useContext`, `useReducer`: Auth & Upload state.
- `useRef`: File inputs.
- `useMemo`: Record filtering.
- `useCallback`: Handlers.
