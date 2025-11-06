import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { policiesAPI } from '../services/api';
import { toast } from 'react-toastify';

const PolicyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState({
    customerName: '',
    premiumAmount: '',
    productType: 'life'
  });

  const productTypes = [
    { value: 'life', label: 'Life Insurance' },
    { value: 'health', label: 'Health Insurance' },
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'home', label: 'Home Insurance' },
    { value: 'business', label: 'Business Insurance' }
  ];

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await policiesAPI.getById(id);
      const policyData = response.data;
      
      // Check if user can edit this policy
      if (policyData.createdBy._id !== user.id) {
        toast.error('You can only edit your own policies');
        navigate('/');
        return;
      }
      
      if (policyData.status !== 'draft') {
        toast.error('You can only edit draft policies');
        navigate('/');
        return;
      }

      setPolicy({
        customerName: policyData.customerName,
        premiumAmount: policyData.premiumAmount,
        productType: policyData.productType
      });
    } catch (error) {
      toast.error('Failed to fetch policy');
      console.error('Error fetching policy:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPolicy({
      ...policy,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await policiesAPI.update(id, policy);
        toast.success('Policy updated successfully');
      } else {
        await policiesAPI.create(policy);
        toast.success('Policy created successfully');
      }
      navigate('/');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update policy' : 'Failed to create policy');
      console.error('Error saving policy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Policy' : 'Create New Policy'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {isEdit ? 'Update policy information' : 'Fill in the details to create a new insurance policy'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                Customer Name *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                required
                value={policy.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label htmlFor="premiumAmount" className="block text-sm font-medium text-gray-700">
                Premium Amount ($) *
              </label>
              <input
                type="number"
                id="premiumAmount"
                name="premiumAmount"
                required
                min="0"
                step="0.01"
                value={policy.premiumAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter premium amount"
              />
            </div>

            <div>
              <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
                Product Type *
              </label>
              <select
                id="productType"
                name="productType"
                required
                value={policy.productType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 sm:space-x-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg text-sm sm:text-base w-full sm:w-auto"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm sm:text-base w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Policy' : 'Create Policy')}
          </button>
        </div>
      </form>

      {!isEdit && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 rounded-lg">
          <h3 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">Important Notes:</h3>
          <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
            <li>• A fraud check will be performed automatically when you create the policy</li>
            <li>• If the fraud check passes, the policy will be sent to the Underwriter for review</li>
            <li>• If the fraud check fails, the policy will be rejected automatically</li>
            <li>• You can only edit policies that are in draft status</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PolicyForm;
