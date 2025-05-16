import { useState } from 'react';
import { Menu, Users, Server, AlertTriangle, Activity, Settings, LogOut, Home } from 'lucide-react';
import apiClient, {authAPI} from '../Intercepter/APiClient';
export default function Sidebar({ activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && <h2 className="font-bold text-xl">API Dashboard</h2>}
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-700">
          <Menu size={20} />
        </button>
      </div>

      <nav className="mt-6 flex flex-col flex-grow">
        <SidebarItem 
          icon={<Home />} 
          title="Overview" 
          collapsed={collapsed} 
          active={activeTab === 'overview'} 
          onClick={() => window.location.href = '/console'} 
        />
        <SidebarItem 
          icon={<Users />} 
          title="Users" 
          collapsed={collapsed} 
          active={activeTab === 'users'} 
          onClick={() => window.location.href = '/users'} 
        />
        <SidebarItem 
          icon={<Server />} 
          title="API Requests" 
          collapsed={collapsed} 
          active={activeTab === 'requests'} 
          onClick={() => window.location.href = '/api-requests'} 
        />
        {/* <SidebarItem 
          icon={<AlertTriangle />} 
          title="Error Logs" 
          collapsed={collapsed} 
          active={activeTab === 'errors'} 
          onClick={() => setActiveTab('errors')} 
        />
        <SidebarItem 
          icon={<Activity />} 
          title="Analytics" 
          collapsed={collapsed} 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')} 
        />
        <SidebarItem 
          icon={<Settings />} 
          title="Settings" 
          collapsed={collapsed} 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        /> */}

        <div className="mt-auto pt-20">
          <SidebarItem 
            icon={<LogOut />} 
            title="Logout" 
            collapsed={collapsed} 
            onClick={() => authAPI.logout()} 
          />
        </div>
      </nav>
    </div>
  );
}

function SidebarItem({ icon, title, collapsed, active = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center py-3 px-4 cursor-pointer transition-colors 
        ${active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      <div className={`${collapsed ? 'mx-auto' : 'mr-3'}`}>
        {icon}
      </div>
      {!collapsed && <span>{title}</span>}
    </div>
  );
}
