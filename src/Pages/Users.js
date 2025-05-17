import { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';
import { Eye, EyeOff, Plus, Search, User, Key, RefreshCw } from 'lucide-react';
import apiClient from '../Intercepter/APiClient';
export default function UsersPage() {
  const [users, setUsers] = useState([
    { regNo: 'A123', name: 'John Doe', apiLimit: 10000, apiUsed: 7500, apiKey: 'key-A123' },
    { regNo: 'B456', name: 'Jane Smith', apiLimit: 5000, apiUsed: 2000, apiKey: 'key-B456' },
    { regNo: 'C789', name: 'Alice Johnson', apiLimit: 8000, apiUsed: 6500, apiKey: 'key-C789' },
  ]);

  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  

  const [increaseQuotaModal, setIncreaseQuotaModal] = useState(false);
  const [addUserModal, setAddUserModal] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  

  const [selectedUser, setSelectedUser] = useState(null);
  const [increaseAmount, setIncreaseAmount] = useState('');
  const [newUser, setNewUser] = useState({ regNo: '', name: '', apiLimit: 50 });
  const [showApiKey, setShowApiKey] = useState(false);

 
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newApiKey, setNewApiKey] = useState('');

   const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users');
      
      if (response.data.success) {
        
        const formattedUsers = response.data.users.map(user => ({
          id: user.id,
          regNo: user.registration_number,
          name: user.name,
          apiLimit: user.api_limit,
          apiUsed: user.api_used,
          apiKey: null 
        }));
        
        setUsers(formattedUsers);
        setError(null);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const result = search
      ? users.filter(u => 
          u.regNo.toLowerCase().includes(search.toLowerCase()) ||
          u.name.toLowerCase().includes(search.toLowerCase())
        )
      : users;
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [search, users]);

  const openIncreaseQuotaModal = (user) => {
    setSelectedUser(user);
    setIncreaseAmount('');
    setIncreaseQuotaModal(true);
  };

  const openApiKeyModal = (user) => {
    setSelectedUser(user);
    setShowApiKey(false);
    setApiKeyModal(true);
  };

  const handleIncreaseQuota = async () => {
    const amount = parseInt(increaseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      const response = await apiClient.post('/api/users/increase-quota', {
        user_id: selectedUser.id,
        increase_amount: amount
      });
      
      if (response.data.success) {
       
        setUsers(users.map(u => (
          u.id === selectedUser.id
            ? { ...u, apiLimit: u.apiLimit + amount }
            : u
        )));
        setIncreaseQuotaModal(false);
      } else {
        alert('Failed to increase quota: ' + response.data.message);
      }
    } catch (err) {
      alert('Error updating quota');
      console.error('Error updating quota:', err);
    }
  };


  

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.regNo) {
      alert('Name and Registration Number are required');
      return;
    }
    
    if (users.some(u => u.regNo === newUser.regNo)) {
      alert('Registration Number already exists');
      return;
    }
    
    try {
      const response = await apiClient.post('/api/users/create', {
        name: newUser.name,
        reg_no: newUser.regNo,
        api_limit: newUser.apiLimit
      });
      
      if (response.data.success) {
        const userToAdd = { 
          id: response.data.user_id,
          regNo: newUser.regNo, 
          name: newUser.name,
          apiLimit: newUser.apiLimit,
          apiUsed: 0, 
          apiKey: response.data.api_key 
        };
        
        setUsers(prev => [...prev, userToAdd]);
        setSelectedUser(userToAdd);
        setNewApiKey(response.data.api_key); 
        setAddUserModal(false);
        setApiKeyModal(true);
      } else {
        alert('Failed to add user: ' + response.data.message);
      }
    } catch (err) {
      alert('Error adding user');
      console.error('Error adding user:', err);
    }
  };

  const resetAddUserForm = () => {
    setNewUser({ regNo: '', name: '', apiLimit: 50 });
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">User API Quotas</h1>
            <button
              onClick={() => {
                resetAddUserForm();
                setAddUserModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Add New User</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or registration number"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">API Usage</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">API Limit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">No users found</td>
                    </tr>
                  ) : paginatedUsers.map(user => {
                    const apiLeft = user.apiLimit - user.apiUsed;
                    const usagePercentage = (user.apiUsed / user.apiLimit) * 100;
                    return (
                      <tr key={user.regNo} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.regNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                usagePercentage > 90 ? 'bg-red-600' : 
                                usagePercentage > 70 ? 'bg-yellow-400' : 'bg-green-500'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-1 text-center">
                            {user.apiUsed.toLocaleString()} / {user.apiLimit.toLocaleString()}
                            <span className={`ml-2 ${apiLeft < 1000 ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                              ({apiLeft.toLocaleString()} left)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {user.apiLimit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => openIncreaseQuotaModal(user)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Increase Quota"
                            >
                              <RefreshCw size={18} />
                            </button>
                            
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex justify-center">
                <nav className="flex space-x-1" aria-label="Pagination">
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === idx + 1 
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Increase Quota Modal */}
      {increaseQuotaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIncreaseQuotaModal(false)}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <RefreshCw size={24} className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Increase API Quota</h2>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-4">
                Current user: <span className="font-medium text-gray-700">{selectedUser.name} ({selectedUser.regNo})</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-gray-500">Current Limit</div>
                  <div className="text-lg font-semibold">{selectedUser.apiLimit.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-gray-500">API Remaining</div>
                  <div className={`text-lg font-semibold ${selectedUser.apiLimit - selectedUser.apiUsed < 1000 ? 'text-red-600' : 'text-green-600'}`}>
                    {(selectedUser.apiLimit - selectedUser.apiUsed).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="increaseAmount">
                Amount to Increase
              </label>
              <input
                id="increaseAmount"
                type="number"
                min="1"
                className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500"
                value={increaseAmount}
                onChange={(e) => setIncreaseAmount(e.target.value)}
                placeholder="Enter number of API calls to add"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIncreaseQuotaModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleIncreaseQuota}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Increase Quota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setAddUserModal(false)}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <User size={24} className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Add New User</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="userName">
                  Full Name
                </label>
                <input
                  id="userName"
                  type="text"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter user name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="userRegNo">
                  Registration Number
                </label>
                <input
                  id="userRegNo"
                  type="text"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.regNo}
                  onChange={(e) => setNewUser({ ...newUser, regNo: e.target.value })}
                  placeholder="Enter registration number"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="userApiLimit">
                  Initial API Limit
                </label>
                <input
                  id="userApiLimit"
                  type="number"
                  min="1"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.apiLimit}
                  onChange={(e) => setNewUser({ ...newUser, apiLimit: parseInt(e.target.value) || 50 })}
                  placeholder="Default: 50"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAddUserModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {apiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setApiKeyModal(false)}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <Key size={24} className="text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">API Key</h2>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-4">
                User: <span className="font-medium text-gray-700">{selectedUser.name} ({selectedUser.regNo})</span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md relative">
                <div className="text-gray-500 text-sm mb-1">API Key</div>
                <div className="font-mono text-sm break-all pr-10">
                  {showApiKey ? selectedUser.apiKey : '••••••••••••••••••••••••••••••••'}
                </div>
                <button 
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-blue-600"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>This API key allows access to our services. Keep it secure and do not share it publicly.</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setApiKeyModal(false)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}