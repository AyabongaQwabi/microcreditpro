import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import PasswordInput from '../components/PasswordInput';

export default function RegisterLenderPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    contactName: '',
    phone: '',
    address: '',
    businessLicense: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // First check if email exists
      const { data: existingUser } = await supabase
        .from('lenders')
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
            user_type: 'lender',
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
        .from('lenders')
        .insert([
          {
            id: authData.user.id,
            business_name: formData.businessName,
            contact_name: formData.contactName,
            phone: formData.phone,
            address: formData.address,
            business_license: formData.businessLicense,
          },
        ]);

      if (profileError) {
        toast.error('Error saving profile. Please try again.');
        return;
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/vendor-dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link to="/" className="flex items-center space-x-2">
            MicroCredit Pro
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Join our network of trusted lenders and grow your lending business with our comprehensive platform."
            </p>
            <footer className="text-sm">The MicroCredit Pro Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create a Lender Account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your business details below to create your account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Business Email
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
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                Contact Person Name
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Business Phone
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
                Business Address
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
              <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-700">
                Business License Number
              </label>
              <input
                id="businessLicense"
                name="businessLicense"
                type="text"
                value={formData.businessLicense}
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
          <p className="px-8 text-center text-sm text-muted-foreground">
            Are you a customer?{" "}
            <Link to="/register" className="underline underline-offset-4 hover:text-primary">
              Register as a customer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}