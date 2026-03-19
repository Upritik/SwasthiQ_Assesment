import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiClient from '../apiClient';

const MedicineFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    medicine_name: '',
    generic_name: '',
    category: '',
    batch_no: '',
    expiry_date: '',
    quantity: 0,
    cost_price: 0,
    mrp: 0,
    supplier: '',
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        medicine_name: '', generic_name: '', category: '', batch_no: '',
        expiry_date: '', quantity: 0, cost_price: 0, mrp: 0, supplier: '', status: 'Active'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'quantity' || name === 'cost_price' || name === 'mrp') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData && initialData.id) {
        await apiClient.put(`/inventory/${initialData.id}`, formData);
      } else {
        await apiClient.post('/inventory', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("An error occurred: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
      <div style={{ background: 'white', padding: 24, borderRadius: 12, width: '600px', maxWidth: '95%', maxHeight: '95vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{initialData ? 'Edit Medicine' : 'Add New Medicine'}</h2>
          <X onClick={onClose} style={{ cursor: 'pointer' }} size={20} color="var(--text-secondary)" />
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Medicine Name</label>
              <input required name="medicine_name" value={formData.medicine_name} onChange={handleChange} className="input" />
            </div>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Generic Name</label>
              <input required name="generic_name" value={formData.generic_name} onChange={handleChange} className="input" />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Category</label>
              <input required name="category" value={formData.category} onChange={handleChange} className="input" />
            </div>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supplier</label>
              <input required name="supplier" value={formData.supplier} onChange={handleChange} className="input" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Batch No</label>
              <input required name="batch_no" value={formData.batch_no} onChange={handleChange} className="input" />
            </div>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Expiry Date</label>
              <input required type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="input" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Quantity</label>
              <input required type="number" min="0" name="quantity" value={formData.quantity} onChange={handleChange} className="input" />
            </div>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cost Price (₹)</label>
              <input required type="number" step="0.01" min="0" name="cost_price" value={formData.cost_price} onChange={handleChange} className="input" />
            </div>
            <div className="input-group">
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>MRP (₹)</label>
              <input required type="number" step="0.01" min="0" name="mrp" value={formData.mrp} onChange={handleChange} className="input" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" className="btn btn-primary">{initialData ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineFormModal;
