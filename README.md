# Pharmacy CRM

A complete Pharmacy CRM that manages inventory, sales, and purchase orders.
The project is split into a **Python FastAPI** backend and a **React (Vite)** frontend.

## Features Built
- **Dashboard**: Sales overview, active items sold, stock indicators, and a dynamic "Make a Sale" component that directly alters Inventory.
- **Inventory Page**: Provides a complete view of medicines in stock with metrics on total value, active items, and low/out-of-stock items.

## REST API Structure

The backend makes use of FastAPIs to implement modular logic grouped by domain:

### 1. Inventory (`/api/inventory`)
- `GET /api/inventory`: Fetches a complete list of all medicines, dynamically calculating their status based on current quantity vs low stock thresholds, and expiry date.
- `POST /api/inventory`: Add a new medicine.
- `PUT /api/inventory/{id}`: Update specific properties of a medicine.
- `DELETE /api/inventory/{id}`: Delete a medicine entity.

### 2. Sales (`/api/sales`)
- `POST /api/sales`: "Make a sale". Takes a `patient_id` and a list of `items` consisting of `medicine_id` and `quantity`. When called, it iterates through the medicines, automatically calculates the subtotal from the MRP, **deducts the requested quantity from the Inventory stock**, generates a unique `invoice_no` and logs both the `Sale` and `SaleItems` relationally to maintain ACID data properties before finalizing the commit.
- `GET /api/sales/recent`: Retrieves the most recent sales with a limit factor.

### 3. Dashboard Summaries (`/api/dashboard` & `/api/inventory/summary`)
- Analytics endpoints that compute todays sales aggregate amounts, low-stock item counts dynamically, and total overall inventory value to be displayed neatly on the frontend stats cards. 

All endpoints follow structured JSON payloads, return appropriate HTTP status codes (404/400 for errors), and implement PyDantic schemas to enforce data consistency before touching the SQLite backend.

## How to Run Locally

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (Windows) or `source venv/bin/activate` (Mac/Linux)
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

*Note: You can seed starter database values by visiting `http://localhost:8000/api/db/init` in your browser.*

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit the frontend URL typically at `http://localhost:5173`.
