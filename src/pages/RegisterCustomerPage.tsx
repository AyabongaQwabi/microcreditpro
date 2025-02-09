import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import PasswordInput from '../components/PasswordInput';

export default function RegisterCustomerPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    employmentStatus: '',
    monthlyIncome: '',
    saIdNumber: '',
  });

  const validateSAIdNumber = (idNumber: string) => {
    if (!/^\d{13}$/.test(idNumber)) {
      return false;
    }

    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Luhn algorithm for checksum validation
    const digits = idNumber.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = digits[i];
      if (i % 2 === 0) {
        sum += digit;
      } else {
        const doubled = digit * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      }
    }
    const checksum = (10 - (sum % 10)) % 10;
    
    return checksum === digits[12];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSAIdNumber(formData.saIdNumber)) {
      toast.error('Please enter a valid South African ID number');
      return;
    }

    try {
      setIsLoading(true);

      // First check if email exists
      const { data: existingUser } = await supabase
        .from('customers')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        toast.error('An account with this email already exists. Please sign in instead.');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: 'customer',
          },
        },
      });

      if (authError) {
        if (authError.message === 'User already registered') {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (authError.name === 'AuthRetryableFetchError') {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Registration failed. Please try again.');
        return;
      }

      const { error: profileError } = await supabase
        .from('customers')
        .insert([
          {
            id: authData.user.id,
            full_name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            employment_status: formData.employmentStatus,
            monthly_income: parseFloat(formData.monthlyIncome),
            sa_id_number: formData.saIdNumber,
          },
        ]);

      if (profileError) {
        toast.error('Error saving profile. Please try again.');
        return;
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/bank-details');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    if (e.target.name === 'saIdNumber') {
      value = value.replace(/\D/g, '').slice(0, 13);
    }
    
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 my-20">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium mt-10">
          <Link to="/" className="flex items-center space-x-2">
            MicroCredit Pro
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Find the perfect loan that matches your needs with our trusted network of lenders."
            </p>
            <footer className="text-sm">The MicroCredit Pro Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create a Customer Account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <PasswordInput
                value={formData.password}
                onChange={handleChange}
                name="password"
              />
            </div>
            <div>
              <label htmlFor="saIdNumber" className="block text-sm font-medium text-gray-700">
                South African ID Number
              </label>
              <input
                id="saIdNumber"
                name="saIdNumber"
                type="text"
                value={formData.saIdNumber}
                onChange={handleChange}
                placeholder="13 digit ID number"
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
                maxLength={13}
              />
              <p className="mt-1 text-sm text-gray-500">
                Please enter your 13-digit South African ID number
              </p>
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">
                Employment Status
              </label>
              <select
                id="employmentStatus"
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select status</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="self-employed">Self-employed</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
            <div>
              <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
                Monthly Income
              </label>
              <input
                id="monthlyIncome"
                name="monthlyIncome"
                type="number"
                value={formData.monthlyIncome}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
          <p className="px-8 text-center text-sm text-muted-foreground mb-10">
            Are you a lender?{" "}
            <Link to="/register-lender" className="underline underline-offset-4 hover:text-primary">
              Register as a lender
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}