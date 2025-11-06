import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { policiesAPI } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await policiesAPI.getAll();
      setPolicies(response.data);
    } catch (error) {
      toast.error('Failed to fetch policies');
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      pending_underwriter: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      pending_manager: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      rejected: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      draft: 'Draft',
      pending_underwriter: 'Pending Underwriter',
      pending_manager: 'Pending Manager',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    return (
      <span className={statusClasses[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getFraudCheckBadge = (fraudCheck) => {
    if (!fraudCheck.checkedAt) return null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fraudCheck.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {fraudCheck.passed ? 'Fraud Check Passed' : 'Fraud Check Failed'}
      </span>
    );
  };

  const canEdit = (policy) => {
    return user.role === 'creator' && policy.createdBy._id === user.id && policy.status === 'draft';
  };

  const canApprove = (policy) => {
    if (user.role === 'underwriter' && policy.status === 'pending_underwriter') return true;
    if (user.role === 'manager' && policy.status === 'pending_manager') return true;
    return false;
  };

  const handleApprove = async (policyId, action) => {
    try {
      const comment = prompt(`Enter comment for ${action}:`);
      if (comment === null) return; // User cancelled

      await policiesAPI.approve(policyId, action, comment);
      toast.success(`Policy ${action}d successfully`);
      fetchPolicies();
    } catch (error) {
      toast.error(`Failed to ${action} policy`);
      console.error(`Error ${action}ing policy:`, error);
    }
  };

  const filteredPolicies = policies.filter(policy => {
    if (filter === 'all') return true;
    if (filter === 'my_policies') return policy.createdBy._id === user.id;
    if (filter === 'pending_approval') return canApprove(policy);
    return policy.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Policy Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage insurance policies and approvals</p>
        </div>
        {user.role === 'creator' && (
          <Link to="/policy/new" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm sm:text-base w-full sm:w-auto text-center">
            Create New Policy
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        >
          <option value="all">All Policies</option>
          {user.role === 'creator' && <option value="my_policies">My Policies</option>}
          <option value="pending_approval">Pending My Approval</option>
          <option value="draft">Draft</option>
          <option value="pending_underwriter">Pending Underwriter</option>
          <option value="pending_manager">Pending Manager</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Policies List */}
      <div className="grid gap-6">
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">No policies found</p>
            {user.role === 'creator' && (
              <Link to="/policy/new" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg mt-4 text-sm sm:text-base">
                Create Your First Policy
              </Link>
            )}
          </div>
        ) : (
          filteredPolicies.map((policy) => (
            <div key={policy._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                      {policy.policyId}
                    </h3>
                    {getStatusBadge(policy.status)}
                    {getFraudCheckBadge(policy.fraudCheck)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Customer:</span> <span className="break-words">{policy.customerName}</span>
                    </div>
                    <div>
                      <span className="font-medium">Premium:</span> ${policy.premiumAmount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Product:</span> {policy.productType}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs sm:text-sm text-gray-500">
                    Created by {policy.creatorName} on {new Date(policy.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-4">
                  <Link
                    to={`/policy/${policy._id}`}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm flex-1 sm:flex-none text-center"
                  >
                    View Details
                  </Link>
                  
                  {canEdit(policy) && (
                    <Link
                      to={`/policy/${policy._id}/edit`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm flex-1 sm:flex-none text-center"
                    >
                      Edit
                    </Link>
                  )}
                  
                  {canApprove(policy) && (
                    <>
                      <button
                        onClick={() => handleApprove(policy._id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(policy._id, 'reject')}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
