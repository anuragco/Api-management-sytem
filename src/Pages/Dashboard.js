import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Menu, Users, Server, AlertTriangle, CheckCircle, Activity, Settings, LogOut, Home } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data - in a real application, this would come from your API
  const userData = {
    totalUsers: 1287,
    growth: "+12.5%",
    newToday: 24
  };
  
  const apiData = {
    totalRequests: 45872,
    successRate: "96.8%",
    failedRequests: 1468
  };
  
  const weeklyData = [
    { name: 'Mon', requests: 1200, success: 1180, failed: 20 },
    { name: 'Tue', requests: 1400, success: 1350, failed: 50 },
    { name: 'Wed', requests: 1800, success: 1720, failed: 80 },
    { name: 'Thu', requests: 1600, success: 1550, failed: 50 },
    { name: 'Fri', requests: 2200, success: 2150, failed: 50 },
    { name: 'Sat', requests: 1800, success: 1750, failed: 50 },
    { name: 'Sun', requests: 1200, success: 1150, failed: 50 },
  ];
  
  const pieData = [
    { name: 'Successful', value: 96.8 },
    { name: 'Failed', value: 3.2 },
  ];
  
  const errorLogs = [
    { id: 1, timestamp: '2025-05-15 09:32:14', error: 'Rate limit exceeded', code: 429, endpoint: '/gemini/text' },
    { id: 2, timestamp: '2025-05-15 08:15:47', error: 'Invalid API key', code: 401, endpoint: '/gemini/chat' },
    { id: 3, timestamp: '2025-05-15 07:58:03', error: 'Timeout error', code: 504, endpoint: '/gemini/generate' },
    { id: 4, timestamp: '2025-05-15 06:42:19', error: 'Invalid request format', code: 400, endpoint: '/gemini/text' },
    { id: 5, timestamp: '2025-05-14 23:11:35', error: 'Rate limit exceeded', code: 429, endpoint: '/gemini/chat' },
  ];
  
  const COLORS = ['#4CAF50', '#F44336'];
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
       <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        
        
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'users' && 'User Analytics'}
            {activeTab === 'requests' && 'API Requests'}
            {activeTab === 'errors' && 'Error Logs'}
            {activeTab === 'analytics' && 'Advanced Analytics'}
            {activeTab === 'settings' && 'Dashboard Settings'}
          </h1>
        </header>
        
        <main className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Users" 
                  value={userData.totalUsers} 
                  change={userData.growth} 
                  icon={<Users className="text-blue-500" />} 
                />
                <StatCard 
                  title="Total API Requests" 
                  value={apiData.totalRequests} 
                  icon={<Server className="text-green-500" />} 
                />
                <StatCard 
                  title="API Success Rate" 
                  value={apiData.successRate} 
                  icon={<CheckCircle className="text-indigo-500" />} 
                />
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">API Requests (Last 7 Days)</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="requests" stroke="#8884d8" />
                        <Line type="monotone" dataKey="success" stroke="#4CAF50" />
                        <Line type="monotone" dataKey="failed" stroke="#F44336" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">API Success Rate</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Recent Error Logs */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Error Logs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {errorLogs.slice(0, 3).map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{log.error}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{log.endpoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'errors' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">All Error Logs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {errorLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{log.error}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{log.endpoint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {(activeTab === 'users' || activeTab === 'requests' || activeTab === 'analytics' || activeTab === 'settings') && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg text-gray-500">This section is under development</h3>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sidebar Item Component
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

// Stat Card Component
function StatCard({ title, value, change, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-gray-100">
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <p className="ml-2 text-sm text-green-600">{change}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}