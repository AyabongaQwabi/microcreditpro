import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, BadgeCheck, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
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

const INTEREST_RATES = [5, 7, 10, 15, 17, 20, 25, 30, 35, 40, 45, 50];
const TERM_MONTHS = [1, 2, 3, 4, 5, 6];

export default function HomePage() {
  const { session } = useAuth();
  const [isLender, setIsLender] = useState(false);
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedRate, setSelectedRate] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    const checkLenderStatus = async () => {
      if (session?.user) {
        try {
          const { data } = await supabase
            .from('lender_profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
          
          setIsLender(!!data);
        } catch (error) {
          console.error('Error checking lender status:', error);
        }
      }
    };

    checkLenderStatus();
  }, [session]);

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (selectedTown) searchParams.append('town', selectedTown);
    if (selectedRate) searchParams.append('rate', selectedRate);
    if (selectedTerm) searchParams.append('term', selectedTerm);
    
    window.location.href = `/find-lenders?${searchParams.toString()}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative bg-primary/5">
        <div className="container px-6 py-16 mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2">
              <h1 className="text-4xl font-bold tracking-wide text-gray-800 dark:text-white lg:text-6xl">
                Find the Perfect
                <span className="text-primary"> Loan</span> for You
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Connect with trusted loan providers and get the financial support you need. Quick approvals, competitive rates, and flexible terms.
              </p>
              <div className="mt-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/find-lenders"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary/90"
                  >
                    Find Loan Providers
                  </Link>
                  <Link
                    to="/eligibility-check"
                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-6 py-3 text-base font-medium text-primary hover:bg-primary/5"
                  >
                    Check Eligibility
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 mt-10 lg:ml-20 lg:mt-0">
              <div className="bg-white rounded-lg shadow-xl p-6 dark:bg-gray-800">
                <h2 className="text-2xl font-semibold mb-4">Find Loan Providers</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Town
                    </label>
                    <select
                      value={selectedTown}
                      onChange={(e) => setSelectedTown(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select your town</option>
                      {EASTERN_CAPE_TOWNS.map(town => (
                        <option key={town} value={town}>{town}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Interest Rate
                    </label>
                    <select
                      value={selectedRate}
                      onChange={(e) => setSelectedRate(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                    >
                      <option value="">Any interest rate</option>
                      {INTEREST_RATES.map(rate => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Loan Term
                    </label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                    >
                      <option value="">Any term length</option>
                      {TERM_MONTHS.map(months => (
                        <option key={months} value={months}>
                          {months} {months === 1 ? 'month' : 'months'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={handleSearch}
                    className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90"
                  >
                    Search Providers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="container px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Provider Search</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find and compare loan providers in your area with our smart search tools.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Trusted</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All our loan providers are verified and follow strict security protocols.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BadgeCheck className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Approval</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get quick loan approvals and access funds when you need them most.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="flex justify-center mb-4">
                <Search className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Search</h3>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Find loan providers in your area
              </p>
            </div>
            <div className="relative">
              <div className="flex justify-center mb-4">
                <BadgeCheck className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Compare</h3>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Compare rates and terms
              </p>
            </div>
            <div className="relative">
              <div className="flex justify-center mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Apply</h3>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Submit your application
              </p>
            </div>
            <div className="relative">
              <div className="flex justify-center mb-4">
                <Wallet className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Get Funded</h3>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Receive your loan quickly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}