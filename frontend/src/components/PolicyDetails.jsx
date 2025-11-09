import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { policiesAPI } from '../services/api';
import { toast } from 'react-toastify';

const PolicyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  const fetchPolicy = async () => {
    try {
      const response = await policiesAPI.getById(id);
      setPolicy(response.data);
    } catch (error) {
      toast.error('Failed to fetch policy details');
      console.error('Error fetching policy:', error);
      navigate('/');
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
      pending_underwriter: 'Pending Underwriter Review',
      pending_manager: 'Pending Manager Review',
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
        {fraudCheck.passed ? '✅ Fraud Check Passed' : '❌ Fraud Check Failed'}
      </span>
    );
  };

  const canEdit = () => {
    // Creator can edit if policy belongs to them and status is draft or pending_underwriter (before manager approval)
    if (user.role === 'creator') {
      return policy.createdBy._id === user.id && 
             (policy.status === 'draft' || policy.status === 'pending_underwriter');
    }
    // Manager can edit if status is pending_manager (before final approval)
    if (user.role === 'manager') {
      return policy.status === 'pending_manager';
    }
    return false;
  };

  const canDelete = () => {
    // Creator can delete if policy belongs to them and manager hasn't approved yet
    if (user.role === 'creator') {
      return policy.createdBy._id === user.id && 
             (policy.status === 'draft' || policy.status === 'pending_underwriter');
    }
    // Manager can delete if status is pending_manager or approved (when they have approved)
    if (user.role === 'manager') {
      return policy.status === 'pending_manager' || policy.status === 'approved';
    }
    return false;
  };

  const canApprove = () => {
    if (user.role === 'underwriter' && policy.status === 'pending_underwriter') return true;
    if (user.role === 'manager' && policy.status === 'pending_manager') return true;
    return false;
  };

  const canSubmit = () => {
    return user.role === 'creator' && 
           policy.createdBy._id === user.id && 
           policy.status === 'draft' &&
           policy.fraudCheck.passed;
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await policiesAPI.submit(id);
      toast.success('Policy submitted for approval');
      fetchPolicy();
    } catch (error) {
      toast.error('Failed to submit policy');
      console.error('Error submitting policy:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (action) => {
    const comment = prompt(`Enter comment for ${action}:`);
    if (comment === null) return; // User cancelled

    setActionLoading(true);
    try {
      await policiesAPI.approve(id, action, comment);
      toast.success(`Policy ${action}d successfully`);
      fetchPolicy();
    } catch (error) {
      toast.error(`Failed to ${action} policy`);
      console.error(`Error ${action}ing policy:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      await policiesAPI.delete(id);
      toast.success('Policy deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete policy');
      console.error('Error deleting policy:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Policy not found</p>
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Policy Details</h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">Policy ID: {policy.policyId}</p>
        </div>
        <Link to="/" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg text-sm sm:text-base w-full sm:w-auto text-center">
          Back to Dashboard
        </Link>
      </div>

      {/* Policy Information */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Policy Information</h2>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(policy.status)}
            {getFraudCheckBadge(policy.fraudCheck)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <p className="text-gray-900">{policy.customerName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Premium Amount</label>
            <p className="text-gray-900">${policy.premiumAmount.toLocaleString()}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
            <p className="text-gray-900 capitalize">{policy.productType}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <p className="text-gray-900">{policy.creatorName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
            <p className="text-gray-900">{formatDate(policy.createdAt)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <p className="text-gray-900">{formatDate(policy.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Approval Logs */}
      {policy.approvalLogs && policy.approvalLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Approval History</h2>
          <div className="space-y-4">
            {policy.approvalLogs.map((log, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-3 sm:pl-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base text-gray-900">
                      {log.approverName} {log.action} the policy
                    </p>
                    {log.comment && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">"{log.comment}"</p>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3 sm:gap-4">
                  {canEdit() && (
                    <Link
                      to={`/policy/${id}/edit`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm sm:text-base flex-1 sm:flex-none text-center"
                    >
                      Edit Policy
                    </Link>
                  )}
                  
                  {canSubmit() && (
                    <button
                      onClick={handleSubmit}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                    >
                      {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                  )}
                  
                  {canApprove() && (
                    <>
                      <button
                        onClick={() => handleApprove('approve')}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                      >
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApprove('reject')}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                      >
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}

                  {canDelete() && (
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                    >
                      {actionLoading ? 'Deleting...' : 'Delete Policy'}
                    </button>
                  )}
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 bg-gray">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Status Information</h3>
        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
          {policy.status === 'draft' && (
            <p>This policy is in draft status. You can edit it or submit it for approval once the fraud check passes.</p>
          )}
          {policy.status === 'pending_underwriter' && (
            <p>This policy is waiting for underwriter review. The underwriter can approve or reject it.</p>
          )}
          {policy.status === 'pending_manager' && (
            <p>This policy has been approved by the underwriter and is now waiting for manager review.</p>
          )}
          {policy.status === 'approved' && (
            <p>This policy has been fully approved and is ready for processing.</p>
          )}
          {policy.status === 'rejected' && (
            <p>This policy has been rejected. Check the approval history for details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyDetails;
