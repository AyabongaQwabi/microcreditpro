import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const EASTERN_CAPE_TOWNS = [
  'Cathcart',
  'Cofimvaba',
  'Komani',
  'Cacadu',
  'Indwe',
  'Dordrecht',
  'eNgcobo',
  'Dutywa',
  'Gatyane',
  'Umtata',
  'Cala',
  'Elliot',
  'Port St Johns',
  'Qumbu',
  'Xhorha',
  'Graaf Reinet',
  'East London',
  'Gqeberha',
  'Qonce',
  'Bhisho',
  'Pedi',
  'Alice',
  'Rhini',
];

export default function PhysicalAddressPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    houseNumber: '',
    streetName: '',
    zoneName: '',
    suburbName: '',
    town: '',
    postalCode: '',
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
        .from('physical_addresses')
        .insert([
          {
            user_id: session.user.id,
            house_number: formData.houseNumber,
            street_name: formData.streetName,
            zone_name: formData.zoneName,
            suburb_name: formData.suburbName,
            town: formData.town,
            postal_code: formData.postalCode,
            province: 'Eastern Cape',
            country: 'South Africa',
          },
        ]);

      if (error) {
        toast.error('Error saving address. Please try again.');
        return;
      }

      toast.success('Address saved successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Address save error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate postal code to only allow numbers
    if (name === 'postalCode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Physical Address Details
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your physical address information
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700">
                House Number
              </label>
              <input
                id="houseNumber"
                name="houseNumber"
                type="text"
                required
                value={formData.houseNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="streetName" className="block text-sm font-medium text-gray-700">
                Street Name
              </label>
              <input
                id="streetName"
                name="streetName"
                type="text"
                required
                value={formData.streetName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="zoneName" className="block text-sm font-medium text-gray-700">
                Zone Name
              </label>
              <input
                id="zoneName"
                name="zoneName"
                type="text"
                required
                value={formData.zoneName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="suburbName" className="block text-sm font-medium text-gray-700">
                Suburb Name
              </label>
              <input
                id="suburbName"
                name="suburbName"
                type="text"
                required
                value={formData.suburbName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="town" className="block text-sm font-medium text-gray-700">
                Town
              </label>
              <select
                id="town"
                name="town"
                required
                value={formData.town}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
              >
                <option value="">Select town</option>
                {EASTERN_CAPE_TOWNS.map(town => (
                  <option key={town} value={town}>{town}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                required
                maxLength={4}
                value={formData.postalCode}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                placeholder="0000"
              />
            </div>

            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                Province
              </label>
              <input
                id="province"
                type="text"
                value="Eastern Cape"
                disabled
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                id="country"
                type="text"
                value="South Africa"
                disabled
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isLoading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}