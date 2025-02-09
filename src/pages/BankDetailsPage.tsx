import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const SOUTH_AFRICAN_BANKS = [
  'ABSA Bank',
  'Capitec Bank',
  'First National Bank',
  'Nedbank',
  'Standard Bank',
  'African Bank',
  'Bidvest Bank',
  'Discovery Bank',
  'TymeBank',
];

const ACCOUNT_TYPES = [
  'Savings',
  'Cheque',
  'Current',
  'Business',
];

export default function BankDetailsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountHolder: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    accountType: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error('Please sign in to continue');
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('bank_accounts')
        .insert([
          {
            user_id: session.user.id,
            account_holder: formData.accountHolder,
            account_number: formData.accountNumber,
            bank_name: formData.bankName,
            branch_code: formData.branchCode,
            account_type: formData.accountType,
          },
        ]);

      if (error) {
        toast.error('Error saving bank details. Please try again.');
        return;
      }

      toast.success('Bank details saved successfully');
      navigate('/physical-address');
    } catch (error) {
      console.error('Bank details error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Only allow numbers for account number and branch code
    if (e.target.name === 'accountNumber' || e.target.name === 'branchCode') {
      value = value.replace(/\D/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Add Your Bank Details
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your banking information to complete your registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">
                Account Holder Name
              </label>
              <input
                id="accountHolder"
                name="accountHolder"
                type="text"
                required
                value={formData.accountHolder}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                Bank Name
              </label>
              <select
                id="bankName"
                name="bankName"
                required
                value={formData.bankName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              >
                <option value="">Select your bank</option>
                {SOUTH_AFRICAN_BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                Account Number
              </label>
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                required
                maxLength={16}
                value={formData.accountNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700">
                Branch Code
              </label>
              <input
                id="branchCode"
                name="branchCode"
                type="text"
                required
                maxLength={6}
                value={formData.branchCode}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="accountType"
                name="accountType"
                required
                value={formData.accountType}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              >
                <option value="">Select account type</option>
                {ACCOUNT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isLoading ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}