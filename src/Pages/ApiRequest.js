import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../Components/Sidebar';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import apiClient from '../Intercepter/APiClient';
const ITEMS_PER_PAGE = 15;

export default function LogsTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);


  const [searchText, setSearchText] = useState('');                     
  const [filterStatus, setFilterStatus] = useState('all');              
  const [currentPage, setCurrentPage] = useState(1);                    
  const [sortConfig, setSortConfig] = useState({ key: 'used_at', direction: 'desc' }); 

 useEffect(() => {
  apiClient.get('/api/v3/api-log')
    .then(res => {
      if (res.data.success && Array.isArray(res.data.logs)) {
        setLogs(res.data.logs);
      } else {
        console.error('Unexpected response:', res.data);
      }
    })
    .catch(err => {
      console.error('Failed to fetch logs:', err);
    })
    .finally(() => setLoading(false));
}, []);

  const processedLogs = useMemo(() => {
    let arr = [...logs];

    if (filterStatus !== 'all') {
      const code = Number(filterStatus);
      arr = arr.filter(log => log.response_status === code);
    }

    if (searchText) {
      const q = searchText.toLowerCase();
      arr = arr.filter(log =>
        log.api_key.toLowerCase().includes(q) ||
        log.endpoint.toLowerCase().includes(q) ||
        String(log.user_id).includes(q)
      );
    }

    if (sortConfig.key) {
      arr.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [logs, filterStatus, searchText, sortConfig]);

  const pageCount = Math.ceil(processedLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = processedLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) return <p className="p-6">Loading logs…</p>;

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-grow p-6 h-ful">
        <h1 className="text-2xl font-bold mb-4">API Usage Logs</h1>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by key, endpoint or user…"
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-lg focus:ring"
          >
            <option value="all">All Statuses</option>
            <option value="200">200 OK</option>
            <option value="400">400 Errors</option>
            <option value="429">429 Rate Limit</option>
            <option value="500">500+ Server</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { label: 'ID', key: 'id' },
                  { label: 'User', key: 'user_id' },
                  { label: 'API Key', key: 'api_key' },
                  { label: 'Endpoint', key: 'endpoint' },
                  { label: 'Method', key: 'request_method' },
                  { label: 'Status', key: 'response_status' },
                  { label: 'Used At', key: 'used_at' },
                  { label: 'Actions', key: null }
                ].map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.key && toggleSort(col.key)}
                    className={`px-4 py-2 text-left text-sm font-medium text-gray-600 select-none ${
                      col.key ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'asc'
                          ? <ChevronUp size={12}/>
                          : <ChevronDown size={12}/>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{log.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.user_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{log.api_key}</td>
                  <td className="px-4 py-2 text-sm text-blue-600 hover:underline">{log.endpoint}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.request_method}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={log.response_status >= 400 ? 'text-red-600' : 'text-green-600'}>
                      {log.response_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {new Date(log.used_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Edit</button>
                    <button className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Copy</button>
                    <button className="px-2 py-1 bg-red-100 text-red-700 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-gray-200"
          >
            <ChevronLeft />
          </button>
          {[...Array(pageCount)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
            disabled={currentPage === pageCount}
            className="p-2 rounded hover:bg-gray-200"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
