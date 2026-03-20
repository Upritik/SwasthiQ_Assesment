import { useState, useEffect } from 'react';
import { Download, Plus, Filter, Package, AlertCircle, DollarSign, Activity, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../apiClient';
import MedicineFormModal from '../components/MedicineFormModal';

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, statusFilter]);

  // 🔔 Listen for inventory updates from other components (e.g., after a sale)
  useEffect(() => {
    const handleInventoryUpdate = () => {
      fetchInventory();
      fetchSummary();
    };
    window.addEventListener('inventory-updated', handleInventoryUpdate);
    return () => window.removeEventListener('inventory-updated', handleInventoryUpdate);
  }, []);

  const fetchSummary = async () => {
    try {
      const summaryRes = await apiClient.get('/inventory/summary');
      setSummary(summaryRes.data);
    } catch(err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      let url = '/inventory?';
      if (searchTerm) url += `search=${searchTerm}&`;
      if (statusFilter) url += `filter_status=${statusFilter}`;
      
      const invRes = await apiClient.get(url);
      setMedicines(invRes.data);
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await apiClient.delete(`/inventory/${id}`);
      await fetchInventory();
      await fetchSummary();
      // Notify other components that inventory has changed
      window.dispatchEvent(new Event('inventory-updated'));
      alert("Item deleted successfully");
    } catch(err) {
      console.error(err);
      alert("Error deleting medicine: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleMarkStatus = async (id, status) => {
    try {
      await apiClient.patch(`/inventory/${id}/status`, { status });
      fetchInventory();
      fetchSummary();
      window.dispatchEvent(new Event('inventory-updated'));
    } catch(err) {
      console.error(err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge-active';
      case 'Low Stock': return 'badge-low';
      case 'Expired': return 'badge-expired';
      case 'Out of Stock': return 'badge-out';
      default: return 'badge-out';
    }
  };

  return (
    <>
      <div className="header">
        <div>
          <h1>Pharmacy CRM</h1>
          <p>Manage inventory, sales, and purchase orders</p>
        </div>
        <div className="header-actions">
          <button className="btn"><Download size={14} /> Export</button>
          <button className="btn btn-primary" onClick={() => { setEditingMed(null); setIsModalOpen(true); }}><Plus size={14} /> Add Medicine</button>
        </div>
      </div>

      <div className="content-area">
        {/* Same tabs row without logic to match image 4 closely */}
        <div className="tabs">
          <div className="tab"><ShoppingCartIcon /> Sales</div>
          <div className="tab"><Package size={16} /> Purchase</div>
          <div className="tab active"><ActivityIcon /> Inventory</div>
          
          <div style={{ flex: 1 }}></div>
          
          <div className="header-actions" style={{ marginBottom: "12px" }}>
            <button className="btn btn-primary"><Plus size={14} /> New Sale</button>
            <button className="btn"><Plus size={14} /> New Purchase</button>
          </div>
        </div>

        {/* --- INVENTORY OVERVIEW --- */}
        <div className="form-title" style={{ marginBottom: 16 }}>Inventory Overview</div>
        <div className="form-section" style={{ display: 'flex', gap: 20, padding: 24 }}>
          <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
              Total Items <Package size={16} color="var(--primary-color)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{summary?.total_items || 0}</div>
          </div>
          
          <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
              Active Stock <Activity size={16} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{summary?.active_stock || 0}</div>
          </div>

          <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
              Low Stock <AlertCircle size={16} color="var(--accent-orange)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{summary?.low_stock || 0}</div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
              Total Value <DollarSign size={16} color="var(--accent-purple)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>₹{summary?.total_value || 0}</div>
          </div>
        </div>

        {/* --- COMPLETE INVENTORY --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="form-title" style={{ marginBottom: 0 }}>Complete Inventory</div>
          <div className="header-actions">
            <input 
              type="text" 
              placeholder="Search medicines..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, outline: 'none' }}
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, outline: 'none', background: 'white', color: 'var(--text-secondary)' }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Expired">Expired</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <button className="btn"><Download size={14} /> Export</button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Generic Name</th>
                <th>Category</th>
                <th>Batch No</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
                <th>Cost Price</th>
                <th>MRP</th>
                <th>Supplier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(med => (
                <tr key={med.id}>
                  <td style={{ fontWeight: 500 }}>{med.medicine_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{med.generic_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{med.category}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{med.batch_no}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{med.expiry_date}</td>
                  <td style={{ fontWeight: 500 }}>{med.quantity}</td>
                  <td>₹{med.cost_price.toFixed(2)}</td>
                  <td>₹{med.mrp.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{med.supplier}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`badge ${getStatusBadgeClass(med.status)}`}>
                        {med.status}
                      </span>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        onClick={() => { setEditingMed(med); setIsModalOpen(true); }}
                      >
                        <Edit2 size={16} color="var(--accent-blue)" />
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        onClick={() => handleDelete(med.id)}
                      >
                        <Trash2 size={16} color="var(--accent-red)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No medicines found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MedicineFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingMed(null); }} 
        onSuccess={() => { 
          fetchInventory(); 
          fetchSummary(); 
          window.dispatchEvent(new Event('inventory-updated')); // Notify others
        }}
        initialData={editingMed}
      />
    </>
  );
};

// Quick Icons for tabs
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;

export default Inventory;