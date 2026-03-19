import { Link, useLocation } from 'react-router-dom';
import { Search, Book, Menu, Activity, Calendar, Users, Stethoscope, Pill, Plus, Sparkles, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: Search, id: 'search', path: '#' },
    { icon: Book, id: 'book', path: '#' },
    { icon: Menu, id: 'menu', path: '#' },
    { icon: Activity, id: 'activity', path: '#' },
    { icon: Calendar, id: 'calendar', path: '#' },
    { icon: Users, id: 'users', path: '#' },
    { icon: Stethoscope, id: 'stethoscope', path: '#' },
    { icon: Pill, id: 'pill', path: '#' },
    { icon: Plus, id: 'plus', path: '/' },
    { icon: Sparkles, id: 'sparkles', path: '#' },
  ];

  return (
    <div className="sidebar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link to={item.path} key={item.id} className={`sidebar-icon ${isActive ? 'active' : ''}`}>
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
          </Link>
        );
      })}
      
      <div style={{ flex: 1 }}></div>
      
      <div className="sidebar-icon" style={{ marginBottom: "20px" }}>
        <Settings size={24} />
      </div>
    </div>
  );
};

export default Sidebar;
