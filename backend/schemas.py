from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MedicineBase(BaseModel):
    medicine_name: str
    generic_name: str
    category: str
    batch_no: str
    expiry_date: str
    quantity: int
    cost_price: float
    mrp: float
    supplier: str
    status: str

class MedicineCreate(MedicineBase):
    pass

class Medicine(MedicineBase):
    id: int

    class Config:
        orm_mode = True

class StatusUpdate(BaseModel):
    status: str

class SaleItemBase(BaseModel):
    medicine_id: int
    quantity: int

class SaleCreate(BaseModel):
    patient_id: str
    payment_mode: str
    items: List[SaleItemBase]

class Sale(BaseModel):
    id: int
    invoice_no: str
    patient_id: str
    items_count: int
    total_amount: float
    payment_mode: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class DashboardSummary(BaseModel):
    todays_sales: float
    items_sold_today: int
    low_stock_items: int
    total_value: float
    pending_purchase_orders_count: int
    pending_purchase_orders_value: float

class InventoryOverview(BaseModel):
    total_items: int
    active_stock: int
    low_stock: int
    total_value: float
