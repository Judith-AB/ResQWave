#  ResQWave — Full Stack Disaster Response Platform

This project is organized as a **monorepo** with separate frontend and backend folders.

---

## Folder Structure
```
ResQWave/
│
├── frontend/ → React + Vite (UI)
├── backend/ → Node.js + Express + Prisma(API)
├── package.json → Root file to run both servers
├── .gitignore
└── README.md
```

---

##  Setup Instructions (for all developers)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/ResQWave.git
cd ResQWave
```

### 2. Install dependencies

For frontend:

```bash
cd frontend
npm install
```

For backend:
```bash
cd ../backend
npm install
```

For root (to run both):
```bash
cd ..
npm install
```

### Running the project locally

Run frontend and backend together from the root:
```bash
npm run dev
```
Or, run them separately:
```bash

# Frontend
cd frontend
npm run dev

# Backend
cd ../backend
npm run dev
```
