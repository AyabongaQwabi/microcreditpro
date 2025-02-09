import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { 
  CircleDollarSign, 
  Calendar, 
  Clock,
  Search,
  MapPin,
  Star,
  ChevronRight,
  Settings,
  Download,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

interface CustomerProfile {
  full_name: string;
  email: string;
  phone: string;
  profile_picture?: string;
}

interface LoanHistory {
  id: string;
  amount: number;
  interest_rate: number;
  status: string;
  completion_date: string;
}

interface ActiveLoan {
  id: string;
  amount: number;
  interest_rate: number;
  remaining_balance: number;
  next_payment_date: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  receipt_number: string;
}

interface LoanProvider {
  id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  interest_rate: number;
  terms: number[];
  rating: number;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [providers, setProviders] = useState<LoanProvider[]>([]);
  
  // Search filters
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadProfile(),
        loadLoanHistory(),
        loadActiveLoans(),
        loadPayments(),
        loadProviders()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('full_name, email, phone, profile_picture')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error loading profile');
    }
  };

  const loadLoanHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, amount, interest_rate, status, completion_date')
        .eq('customer_id', session?.user?.id)
        .not('status', 'eq', 'active')
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setLoanHistory(data || []);
    } catch (error) {
      console.error('Error loading loan history:', error);
      toast.error('Error loading loan history');
    }
  };

  const loadActiveLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          amount,
          interest_rate,
          remaining_balance,
          next_payment_date,
          status
        `)
        .eq('customer_id', session?.user?.id)
        .eq('status', 'active');

      if (error) throw error;
      setActiveLoans(data || []);
    } catch (error) {
      console.error('Error loading active loans:', error);
      toast.error('Error loading active loans');
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('id, amount, payment_date, receipt_number')
        .eq('customer_id', session?.user?.id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Error loading payments');
    }
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_offers')
        .select(`
          id,
          lender:lender_profiles (
            business_name,
            address,
            rating
          ),
          interest_rate,
          term_months
        `)
        .eq('status', 'active');

      if (error) throw error;

      const transformedProviders: LoanProvider[] = (data || []).map(provider => ({
        id: provider.id,
        name: provider.lender?.business_name || '',
        location: {
          coordinates: [-30.5595, 22.9375] // Default to center of South Africa
        },
        interest_rate: provider.interest_rate || 0,
        terms: [provider.term_months],
        rating: provider.lender?.rating || 0
      }));

      setProviders(transformedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Error loading providers');
    }
  };

  const handlePayNow = async (loanId: string) => {
    // Implement payment logic
    toast.info('Redirecting to payment gateway...');
  };

  const downloadReceipt = async (receiptNumber: string) => {
    // Implement receipt download logic
    toast.info('Downloading receipt...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.full_name}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl text-primary">
                    {profile?.full_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.full_name}</h2>
              <p className="text-sm text-gray-600">{profile?.email}</p>
              <p className="text-sm text-gray-600">{profile?.phone}</p>
            </div>
          </div>
        </div>

        {/* Loan Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Find Loan Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Town
              </label>
              <select
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Select your town</option>
                {EASTERN_CAPE_TOWNS.map(town => (
                  <option key={town} value={town}>{town}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate
              </label>
              <select
                value={selectedRate || ''}
                onChange={(e) => setSelectedRate(Number(e.target.value) || null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Any interest rate</option>
                {INTEREST_RATES.map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term
              </label>
              <select
                value={selectedTerm || ''}
                onChange={(e) => setSelectedTerm(Number(e.target.value) || null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Any term length</option>
                {TERM_MONTHS.map(months => (
                  <option key={months} value={months}>
                    {months} {months === 1 ? 'month' : 'months'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const searchParams = new URLSearchParams();
                  if (selectedTown) searchParams.append('town', selectedTown);
                  if (selectedRate) searchParams.append('rate', selectedRate.toString());
                  if (selectedTerm) searchParams.append('term', selectedTerm.toString());
                  navigate(`/find-lenders?${searchParams.toString()}`);
                }}
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90"
              >
                Search Providers
              </button>
            </div>
          </div>

          {showMap && (
            <div className="h-[400px] mb-6 rounded-lg overflow-hidden">
              <MapContainer
                center={[-30.5595, 22.9375]}
                zoom={5}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {providers.map((provider) => (
                  <Marker
                    key={provider.id}
                    position={provider.location.coordinates}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-sm">Rate: {provider.interest_rate}%</p>
                        <button
                          onClick={() => navigate(`/apply/${provider.id}`)}
                          className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                        >
                          Apply Now
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Active Loans */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Active Loans</h3>
          {activeLoans.length === 0 ? (
            <p className="text-gray-600">No active loans</p>
          ) : (
            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="border-b last:border-0 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">R{loan.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {loan.interest_rate}% Interest Rate
                      </p>
                      <p className="text-sm text-gray-600">
                        Next Payment: {new Date(loan.next_payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        loan.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {loan.status}
                      </span>
                      <p className="text-sm font-medium mt-2">
                        Balance: R{loan.remaining_balance.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handlePayNow(loan.id)}
                        className="mt-2 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Payment History</h3>
          {payments.length === 0 ? (
            <p className="text-gray-600">No payment history</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left text-sm font-medium text-gray-500">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-4">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="py-4">R{payment.amount.toFixed(2)}</td>
                      <td className="py-4">
                        <button
                          onClick={() => downloadReceipt(payment.receipt_number)}
                          className="flex items-center text-primary hover:text-primary/80"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;