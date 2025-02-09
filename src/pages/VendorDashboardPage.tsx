import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { 
  CircleDollarSign, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  ScrollText
} from 'lucide-react';
import LoanOfferManagement from './vendor/LoanOfferManagement';
import TermsManagement from './vendor/TermsManagement';

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  pendingRepayments: number;
  availableCapital: number;
  totalCustomers: number;
  overdueLoanCount: number;
}

interface LoanOffer {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
}

interface Customer {
  id: string;
  full_name: string;
  risk_grade: string;
  active_loans: number;
  total_borrowed: number;
}

interface Loan {
  id: string;
  customer: {
    full_name: string;
    email: string;
  };
  amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  start_date: string;
  end_date: string;
}

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    activeLoans: 0,
    pendingRepayments: 0,
    availableCapital: 0,
    totalCustomers: 0,
    overdueLoanCount: 0
  });
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const navigationItems = [
    { name: 'Dashboard', path: '/vendor-dashboard', icon: TrendingUp },
    { name: 'Loan Offers', path: '/vendor-dashboard/loan-offers', icon: FileText },
    { name: 'Terms & Conditions', path: '/vendor-dashboard/terms', icon: ScrollText },
  ];

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadActiveLoans(),
        loadLoanOffers(),
        loadCustomers()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [loansData, capitalData, customersData] = await Promise.all([
        supabase
          .from('loans')
          .select('id, status, amount')
          .eq('lender_id', session?.user?.id),
        supabase
          .from('vendor_capital')
          .select('amount, type')
          .eq('vendor_id', session?.user?.id)
          .eq('status', 'completed'),
        supabase
          .from('customer_risk_assessments')
          .select('customer_id')
          .eq('vendor_id', session?.user?.id)
      ]);

      if (loansData.error) throw loansData.error;
      if (capitalData.error) throw capitalData.error;
      if (customersData.error) throw customersData.error;

      const loans = loansData.data || [];
      const capital = capitalData.data || [];
      
      const availableCapital = capital.reduce((acc, transaction) => {
        return transaction.type === 'deposit' 
          ? acc + transaction.amount 
          : acc - transaction.amount;
      }, 0);

      setStats({
        totalLoans: loans.length,
        activeLoans: loans.filter(loan => loan.status === 'active').length,
        pendingRepayments: loans.filter(loan => loan.status === 'overdue').length,
        availableCapital,
        totalCustomers: new Set(customersData.data?.map(c => c.customer_id)).size,
        overdueLoanCount: loans.filter(loan => loan.status === 'overdue').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error loading statistics');
    }
  };

  const loadActiveLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customer_profiles(
            full_name,
            email
          )
        `)
        .eq('lender_id', session?.user?.id)
        .in('status', ['active', 'overdue']);

      if (error) throw error;
      setActiveLoans(data || []);
    } catch (error) {
      console.error('Error loading loans:', error);
      toast.error('Error loading loans');
    }
  };

  const loadLoanOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_offers')
        .select('*')
        .eq('vendor_id', session?.user?.id);

      if (error) throw error;
      setLoanOffers(data || []);
    } catch (error) {
      console.error('Error loading loan offers:', error);
      toast.error('Error loading loan offers');
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_risk_assessments')
        .select(`
          customer:customer_profiles(
            id,
            full_name
          ),
          risk_grade
        `)
        .eq('vendor_id', session?.user?.id);

      if (error) throw error;

      const customersData = data?.map(assessment => ({
        id: assessment.customer.id,
        full_name: assessment.customer.full_name,
        risk_grade: assessment.risk_grade,
        active_loans: 0,
        total_borrowed: 0
      })) || [];

      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Error loading customers');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
              </div>
              <nav className="hidden md:flex ml-8 space-x-8">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        location.pathname === item.path
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CircleDollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Available Capital
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            R{stats.availableCapital.toFixed(2)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Loans
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {stats.activeLoans}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Overdue Loans
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {stats.overdueLoanCount}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Loans */}
              <div className="mt-8">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Active Loans</h2>
                      <div className="flex space-x-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search loans..."
                            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Interest Rate
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Term
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activeLoans.map((loan) => (
                            <tr key={loan.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {loan.customer.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {loan.customer.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  R{loan.amount.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {loan.interest_rate}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {loan.term_months} months
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  loan.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {loan.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Offers */}
              <div className="mt-8">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Loan Offers</h2>
                      <button
                        onClick={() => navigate('/vendor-dashboard/create-offer')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Offer
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {loanOffers.map((offer) => (
                        <div
                          key={offer.id}
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <h3 className="text-lg font-medium text-gray-900">
                            {offer.name}
                          </h3>
                          <dl className="mt-2 space-y-2">
                            <div>
                              <dt className="text-sm text-gray-500">Amount Range</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                R{offer.min_amount} - R{offer.max_amount}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm text-gray-500">Interest Rate</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {offer.interest_rate}%
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm text-gray-500">Term</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {offer.term_months} months
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              offer.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {offer.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customers */}
              <div className="mt-8">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Customers</h2>
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Search customers..."
                          className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer Name
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Risk Grade
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Active Loans
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Borrowed
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customers.map((customer) => (
                            <tr key={customer.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.full_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  customer.risk_grade === 'A' || customer.risk_grade === 'B'
                                    ? 'bg-green-100 text-green-800'
                                    : customer.risk_grade === 'C' || customer.risk_grade === 'D'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {customer.risk_grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {customer.active_loans}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  R{customer.total_borrowed.toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          } />
          <Route path="/loan-offers" element={<LoanOfferManagement />} />
          <Route path="/terms" element={<TermsManagement />} />
        </Routes>
      </div>
    </div>
  );
}