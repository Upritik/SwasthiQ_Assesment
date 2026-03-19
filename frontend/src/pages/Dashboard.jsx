import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, AlertTriangle, Package, Download, Plus, Search, Book } from 'lucide-react';
import apiClient from '../apiClient';
import MedicineFormModal from '../components/MedicineFormModal';
import InventorySection from '../components/InventorySection';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  // Sale Form State
  const [patientId, setPatientId] = useState('');
  const [searchMed, setSearchMed] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [qty, setQty] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Optional: to refresh Inventory if needed
  
  const [activeTab, setActiveTab] = useState('Sales');

  const fetchData = async () => {
    try {
      const summaryRes = await apiClient.get('/dashboard/summary');
      setSummary(summaryRes.data);
      
      const salesRes = await apiClient.get('/sales/recent');
      setRecentSales(salesRes.data);
      
      const inventoryRes = await apiClient.get('/inventory');
      setMedicines(inventoryRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMakeSale = async () => {
    if (!selectedMed || !patientId || qty <= 0) return alert("Fill all details correctly.");
    
    try {
      await apiClient.post('/sales', {
        patient_id: patientId,
        payment_mode: 'Card', // Hardcoded for simplicity as image didn't have selection
        items: [{ medicine_id: selectedMed.id, quantity: qty }]
      });
      alert("Sale Successful!");
      
      // Reset form
      setPatientId('');
      setSearchMed('');
      setSelectedMed(null);
      setQty(1);
      
      // Refresh Data
      fetchData();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert("Error making sale: " + (err.response?.data?.detail || err.message));
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={14} /> Add Medicine</button>
        </div>
      </div>

      <div className="content-area">
        {/* --- STATS GRID --- */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: 'var(--accent-green)' }}><DollarSign size={20} /></div>
              <span className="stat-tag tag-green">+12.5%</span>
            </div>
            <div className="stat-value">₹{summary?.todays_sales.toLocaleString() || '0'}</div>
            <div className="stat-label">Today's Sales</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: 'var(--accent-blue)' }}><ShoppingCart size={20} /></div>
              <span className="stat-tag tag-blue">32 Orders</span>
            </div>
            <div className="stat-value">{summary?.items_sold_today || '0'}</div>
            <div className="stat-label">Items Sold Today</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: 'var(--accent-orange)' }}><AlertTriangle size={20} /></div>
              <span className="stat-tag tag-orange">Action Needed</span>
            </div>
            <div className="stat-value">{summary?.low_stock_items || '0'}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: 'var(--accent-purple)' }}><Package size={20} /></div>
              <span className="stat-tag tag-purple">{summary?.pending_purchase_orders_count || 0} Pending</span>
            </div>
            <div className="stat-value">₹{summary?.pending_purchase_orders_value?.toLocaleString() || '0'}</div>
            <div className="stat-label">Purchase Orders</div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="tabs">
          <div className={`tab ${activeTab === 'Sales' ? 'active' : ''}`} onClick={() => setActiveTab('Sales')} style={{ cursor: 'pointer' }}><ShoppingCart size={16} /> Sales</div>
          <div className="tab" style={{ cursor: 'pointer' }}><Package size={16} /> Purchase</div>
          <div className={`tab ${activeTab === 'Inventory' ? 'active' : ''}`} onClick={() => setActiveTab('Inventory')} style={{ cursor: 'pointer' }}><Book size={16} /> Inventory</div>
          
          <div style={{ flex: 1 }}></div>
          
          <div className="header-actions" style={{ marginBottom: "12px" }}>
            <button className="btn btn-primary"><Plus size={14} /> New Sale</button>
            <button className="btn"><Plus size={14} /> New Purchase</button>
          </div>
        </div>

        {activeTab === 'Sales' && (
          <>
            {/* --- MAKE SALE SECTION --- */}
            <div className="form-section">
          <div className="form-title">Make a Sale</div>
          <div className="form-subtitle">Select medicines from inventory</div>
          
          <div className="form-row">
            <div className="input-group">
              <input 
                type="text" 
                className="input" 
                placeholder="Patient Id" 
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
              />
            </div>
            
            <div className="input-group" style={{ flex: 2, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <Search size={16} color="var(--text-secondary)" style={{ marginLeft: 10 }} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search medicines..." 
                  style={{ border: 'none', flex: 1 }}
                  value={searchMed}
                  onChange={e => setSearchMed(e.target.value)}
                />
              </div>
              
              {/* Basic Dropdown for search simulation */}
              {searchMed && !selectedMed && (
                <div style={{ position: 'absolute', top: 40, left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  {medicines.filter(m => m.medicine_name.toLowerCase().includes(searchMed.toLowerCase())).map(m => (
                    <div key={m.id} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: 13 }} 
                         onClick={() => { setSelectedMed(m); setSearchMed(m.medicine_name); }}>
                      <span style={{ fontWeight: 500 }}>{m.medicine_name}</span> <span style={{ color: 'var(--text-secondary)' }}>(₹{m.mrp}) - Stock: {m.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="input-group" style={{ flex: 0.5 }}>
              <input 
                type="number" 
                className="input" 
                min="1"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
              />
            </div>

            <button className="btn btn-primary" onClick={handleMakeSale} style={{ height: '38px' }}>Enter</button>
            <button className="btn" style={{ background: '#ea580c', color: 'white', border: 'none', height: '38px', marginLeft: 20 }}>Bill</button>
          </div>
        </div>

        {/* --- RECENT SALES --- */}
        <div className="form-title">Recent Sales</div>
        <div>
            {recentSales.map(sale => (
              <div key={sale.id} className="sale-item">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div className="sale-icon"><ShoppingCart size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sale.invoice_no}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {sale.patient_id} • {sale.items_count} items • {sale.payment_mode}
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>₹{sale.total_amount}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>
                    {new Date(sale.created_at).toISOString().split('T')[0]}
                  </div>
                  <span className={`badge ${sale.status === 'Completed' ? 'badge-active' : 'badge-low'}`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No recent sales</p>}
          </div>
          </>
        )}

        {activeTab === 'Inventory' && (
          <InventorySection refreshTrigger={refreshTrigger} />
        )}
      </div>

      <MedicineFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchData()}
      />
    </>
  );
};

export default Dashboard;
