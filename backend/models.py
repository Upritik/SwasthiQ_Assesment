from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String, index=True)
    generic_name = Column(String)
    category = Column(String)
    batch_no = Column(String)
    expiry_date = Column(String) # YYYY-MM-DD
    quantity = Column(Integer)
    cost_price = Column(Float)
    mrp = Column(Float)
    supplier = Column(String)
    status = Column(String) # Active, Low Stock, Expired, Out of Stock

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, index=True)
    patient_id = Column(String)
    items_count = Column(Integer)
    total_amount = Column(Float)
    payment_mode = Column(String) # Card, Cash, UPI
    status = Column(String, default="Completed")
    created_at = Column(DateTime, default=datetime.utcnow)

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer)
    medicine_id = Column(Integer)
    quantity = Column(Integer)
    amount = Column(Float)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, index=True)
    supplier = Column(String)
    items_count = Column(Integer)
    total_amount = Column(Float)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
