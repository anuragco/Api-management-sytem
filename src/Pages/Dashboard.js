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
  Legend
} from 'recharts';
import { Users, Server, CheckCircle } from 'lucide-react';
import apiClient from '../Intercepter/APiClient';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mock data for weekly chart - in a real app, this would come from your API
  const weeklyData = [
    { name: 'Mon', requests: 1200, success: 1180, failed: 20 },
    { name: 'Tue', requests: 1400, success: 1350, failed: 50 },
    { name: 'Wed', requests: 1800, success: 1720, failed: 80 },
    { name: 'Thu', requests: 1600, success: 1550, failed: 50 },
    { name: 'Fri', requests: 2200, success: 2150, failed: 50 },
    { name: 'Sat', requests: 1800, success: 1750, failed: 50 },
    { name: 'Sun', requests: 1200, success: 1150, failed: 50 },
  ];
  
  const COLORS = ['#4CAF50', '#F44336'];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/analytics');
        setAnalytics(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to fetch analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Prepare pie chart data from API response
  const getPieData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Successful', value: parseFloat(analytics.api_success_rate.successful) },
      { name: 'Failed', value: parseFloat(analytics.api_success_rate.failed) }
    ];
  };

  // Parse error JSON from API response
  const parseErrorJson = (errorJson) => {
    try {
      return JSON.parse(errorJson).error;
    } catch (e) {
      return errorJson;
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - simplified for this example */}
      <div className="w-64 bg-gray-900">
        <div className="p-4">
          <h2 className="text-white font-semibold text-xl">API Dashboard</h2>
        </div>
        <nav className="mt-6">
          <SidebarItem 
            icon={<Server />} 
            title="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<Users />} 
            title="Users" 
            active={activeTab === 'users'} 
            onClick={() => window.location.href = '/users'} 
          />
          <SidebarItem 
            icon={<CheckCircle />} 
            title="Error Logs" 
            active={activeTab === 'errors'} 
            onClick={() => setActiveTab('errors')} 
          />
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
        </header>
        
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading analytics data...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-600">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Users" 
                  value={analytics.total_users} 
                  icon={<Users className="text-blue-500" />} 
                />
                <StatCard 
                  title="Total API Requests" 
                  value={analytics.total_requests} 
                  icon={<Server className="text-green-500" />} 
                />
                <StatCard 
                  title="API Success Rate" 
                  value={analytics.api_success_rate.successful} 
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
                          data={getPieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}%`}
                        >
                          {getPieData().map((entry, index) => (
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
                      {analytics.recent_errors.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                            {parseErrorJson(log.error)}
                          </td>
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
        </main>
      </div>
    </div>
  );
}

// Sidebar Item Component
function SidebarItem({ icon, title, active = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center py-3 px-4 cursor-pointer transition-colors 
        ${active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      <div className="mr-3">
        {icon}
      </div>
      <span>{title}</span>
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