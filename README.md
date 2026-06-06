# PropSys - Property Management System

A full-stack property management app for landlords and tenants. Landlords can manage properties, tenants, leases, rent payments, and maintenance requests. Tenants can view their own lease, payments, and submit maintenance requests.

## Tech Stack

**Backend**
- Python 3 + Flask
- Flask-SQLAlchemy (ORM)
- Flask-CORS
- SQLite (single-file database)

**Frontend**
- React 19
- Vite
- React Router 7
- Tailwind CSS
- Axios

## Features

- **Landlords**: track properties, monthly rent roll, occupancy, and per-landlord dashboards
- **Properties**: flats, houses, studios with bedrooms, rent, and status (`available` / `occupied`)
- **Tenants**: tenant records with contact details
- **Leases**: start/end dates, deposit, status, with automatic detection of overlapping bookings
- **Payments**: monthly rent payments auto-generated for each lease, with `paid` / `pending` / `overdue` statuses synced against today's date
- **Maintenance requests**: open/in-progress/resolved, priority levels
- **Automation alerts**: upcoming rent reminders, leases expiring within 45 days, and stale maintenance follow-ups
- **Seeded demo data**: the database is pre-populated with example landlords, tenants, properties, leases, and payments on first run

## Project Structure

```
propsys/
├── app.py                # Flask backend (API + models + seed data)
├── simulate.py           # Script that exercises the API end-to-end
├── requirements.txt      # Python dependencies
├── instance/             # SQLite database lives here (gitignored)
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Dashboard, Properties, Tenants, Leases, Payments, Maintenance
│   │   ├── components/   # Layout, ErrorBoundary, Toast
│   │   └── api/          # Axios client
│   └── package.json
└── package.json          # Root convenience scripts that forward to frontend/
```

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/propsys.git
cd propsys
```

### 2. Set up the backend
```bash
# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Set up the frontend
```bash
cd frontend
npm install
cd ..
```

## Running the App

You need **two terminals**: one for the API, one for the frontend.

### Terminal 1: start the Flask API
```bash
# (with venv activated)
python app.py
```
The API runs at `http://localhost:5000`. On first run it creates `instance/propman.db` and seeds demo data automatically.

### Terminal 2: start the React frontend
```bash
npm run dev
```
The frontend runs at `http://localhost:5173` (Vite's default) and talks to the Flask API on port 5000.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/landlords/<id>` | Get a landlord with metrics |
| GET | `/landlords/<id>/dashboard` | Full landlord dashboard payload |
| GET / POST | `/properties` | List or create properties |
| PUT / DELETE | `/properties/<id>` | Update or delete a property |
| GET / POST | `/tenants` | List or create tenants |
| PUT / DELETE | `/tenants/<id>` | Update or delete a tenant |
| GET / POST | `/leases` | List or create leases (auto-generates monthly payments) |
| POST | `/leases/<id>/terminate` | Terminate a lease |
| GET / PUT | `/payments` | List or update payments |
| GET / PUT | `/maintenance-requests` | List or update maintenance requests |
| GET | `/automation/alerts` | Rent reminders, lease expiries, maintenance follow-ups |

## Testing the API

With the backend running, you can exercise the endpoints end-to-end:
```bash
python simulate.py
```

## Resetting the Database

Delete the SQLite file and restart the server, it will recreate the schema and re-seed the demo data:
```bash
rm instance/propman.db   # Windows: del instance\propman.db
python app.py
```

## Build for Production

```bash
npm run build
```
The frontend build output is written to `frontend/dist/`.
