from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional
from . import models
from . import schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

# --- Create FastAPI app ---
app = FastAPI(title="Pharmacy CRM API")

# --- Add CORS middleware here ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all domains
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Pharmacy CRM API is running 🚀"}

# ----------------- INVENTORY ROUTES -----------------

@app.get("/api/inventory", response_model=list[schemas.Medicine])
def read_medicines(skip: int = 0, limit: int = 100, search: Optional[str] = None, filter_status: Optional[str] = None, db: Session = Depends(get_db)):
    # Update status dynamically
    all_medicines = db.query(models.Medicine).all()
    today = date.today().isoformat()
    for med in all_medicines:
        if med.quantity == 0:
            med.status = "Out of Stock"
        elif med.quantity < 20: # arbitrary low stock threshold
            med.status = "Low Stock"
        elif med.expiry_date and med.expiry_date < today:
            med.status = "Expired"
        else:
            med.status = "Active"
    db.commit()

    query = db.query(models.Medicine)
    if search:
        query = query.filter(models.Medicine.medicine_name.contains(search))
    if filter_status:
        query = query.filter(models.Medicine.status == filter_status)
    return query.offset(skip).limit(limit).all()

@app.post("/api/inventory", response_model=schemas.Medicine)
def create_medicine(medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = models.Medicine(**medicine.dict())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.put("/api/inventory/{medicine_id}", response_model=schemas.Medicine)
def update_medicine(medicine_id: int, medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    for var, value in vars(medicine).items():
        setattr(db_medicine, var, value) if value is not None else None
    
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.patch("/api/inventory/{medicine_id}/status", response_model=schemas.Medicine)
def mark_medicine_status(medicine_id: int, status_update: schemas.StatusUpdate, db: Session = Depends(get_db)):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    db_medicine.status = status_update.status
    if status_update.status == "Out of Stock":
        db_medicine.quantity = 0
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.delete("/api/inventory/{medicine_id}")
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(db_medicine)
    db.commit()
    return {"ok": True}

# ----------------- SALES ROUTES -----------------

@app.post("/api/sales", response_model=schemas.Sale)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    # Calculate amount & check stock
    total_amount = 0.0
    items_count = len(sale.items)
    for item in sale.items:
        med = db.query(models.Medicine).filter(models.Medicine.id == item.medicine_id).first()
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine {item.medicine_id} not found")
        if med.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {med.medicine_name}")
        
        # update stock
        med.quantity -= item.quantity
        total_amount += med.mrp * item.quantity

    # Generate Invoice No
    import time
    invoice_no = f"INV-{date.today().year}-{int(time.time())}"

    db_sale = models.Sale(
        invoice_no=invoice_no,
        patient_id=sale.patient_id,
        items_count=items_count,
        total_amount=total_amount,
        payment_mode=sale.payment_mode
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    # Add items
    for item in sale.items:
        med = db.query(models.Medicine).filter(models.Medicine.id == item.medicine_id).first()
        db_sale_item = models.SaleItem(
            sale_id=db_sale.id,
            medicine_id=item.medicine_id,
            quantity=item.quantity,
            amount=med.mrp * item.quantity
        )
        db.add(db_sale_item)
    
    db.commit()
    return db_sale

@app.get("/api/sales/recent", response_model=list[schemas.Sale])
def get_recent_sales(limit: int = 5, db: Session = Depends(get_db)):
    return db.query(models.Sale).order_by(models.Sale.created_at.desc()).limit(limit).all()

# ----------------- DASHBOARD ROUTES -----------------

@app.get("/api/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Calculate today's sales
    today = date.today()
    sales_today = db.query(models.Sale).filter(models.Sale.created_at >= datetime(today.year, today.month, today.day)).all()
    todays_sales = sum([s.total_amount for s in sales_today])
    items_sold = sum([s.items_count for s in sales_today])
    
    low_stock_count = db.query(models.Medicine).filter(models.Medicine.quantity < 20).filter(models.Medicine.quantity > 0).count()
    
    medicines = db.query(models.Medicine).all()
    total_val = sum([m.quantity * m.mrp for m in medicines])

    pending_orders = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.status == "Pending").all()
    po_count = len(pending_orders)
    po_amount = sum([po.total_amount for po in pending_orders])

    return schemas.DashboardSummary(
        todays_sales=todays_sales,
        items_sold_today=items_sold,
        low_stock_items=low_stock_count,
        total_value=total_val,
        pending_purchase_orders_count=po_count,
        pending_purchase_orders_value=po_amount
    )

@app.get("/api/inventory/summary", response_model=schemas.InventoryOverview)
def get_inventory_summary(db: Session = Depends(get_db)):
    medicines = db.query(models.Medicine).all()
    total_items = len(medicines)
    active_stock = db.query(models.Medicine).filter(models.Medicine.quantity >= 20).count()
    low_stock = db.query(models.Medicine).filter(models.Medicine.quantity < 20).filter(models.Medicine.quantity > 0).count()
    total_val = sum([m.quantity * m.cost_price for m in medicines])

    return schemas.InventoryOverview(
        total_items=total_items,
        active_stock=active_stock,
        low_stock=low_stock,
        total_value=total_val
    )

@app.get("/api/db/init")
def seed_database(db: Session = Depends(get_db)):
    # seed some data to test the frontend if DB is empty
    if db.query(models.Medicine).count() == 0:
        med1 = models.Medicine(
            medicine_name="Paracetamol 650mg", generic_name="Acetaminophen", category="Analgesic",
            batch_no="PCM-2024-0892", expiry_date="2026-08-20", quantity=500, cost_price=15.00, mrp=25.00, supplier="MedSupply Co.", status="Active"
        )
        med2 = models.Medicine(
            medicine_name="Omeprazole 20mg Capsule", generic_name="Omeprazole", category="Gastric",
            batch_no="OMP-2024-5873", expiry_date="2025-11-10", quantity=15, cost_price=65.00, mrp=95.75, supplier="HealthCare Ltd.", status="Low Stock"
        )
        med3 = models.Medicine(
            medicine_name="Aspirin 75mg", generic_name="Aspirin", category="Anticoagulant",
            batch_no="ASP-2023-3401", expiry_date="2024-09-30", quantity=300, cost_price=28.00, mrp=45.00, supplier="GreenMed", status="Expired"
        )
        med4 = models.Medicine(
            medicine_name="Atorvastatin 10mg", generic_name="Atorvastatin Besylate", category="Cardiovascular",
            batch_no="AME-2024-0945", expiry_date="2025-10-15", quantity=0, cost_price=145.00, mrp=195.00, supplier="PharmaCorp", status="Out of Stock"
        )
        db.add_all([med1, med2, med3, med4])

    if db.query(models.PurchaseOrder).count() == 0:
        po1 = models.PurchaseOrder(order_no="PO-2024-001", supplier="PharmaCorp", items_count=50, total_amount=45000.0, status="Pending")
        po2 = models.PurchaseOrder(order_no="PO-2024-002", supplier="MedSupply Co.", items_count=100, total_amount=51250.0, status="Pending")
        db.add_all([po1, po2])
        
    db.commit()
    return {"msg": "DB Seeded gracefully"}
