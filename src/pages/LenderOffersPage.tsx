import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { CircleDollarSign, Calendar, Star, ChevronRight } from 'lucide-react';

interface LoanOffer {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  lender: {
    business_name: string;
    rating: number;
  };
}

export default function LenderOffersPage() {
  const { lenderId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [lenderName, setLenderName] = useState('');
  const [lenderRating, setLenderRating] = useState(0);

  useEffect(() => {
    if (!lenderId) {
      toast.error('Invalid lender ID');
      navigate('/find-lenders');
      return;
    }

    loadLoanOffers();
  }, [lenderId]);

  const loadLoanOffers = async () => {
    try {
      const { data: lenderData, error: lenderError } = await supabase
        .from('lender_profiles')
        .select('business_name, rating')
        .eq('id', lenderId)
        .single();

      if (lenderError) throw lenderError;
      if (!lenderData) {
        toast.error('Lender not found');
        navigate('/find-lenders');
        return;
      }

      setLenderName(lenderData.business_name);
      setLenderRating(lenderData.rating);

      const { data: offers, error: offersError } = await supabase
        .from('loan_offers')
        .select(`
          *,
          lender:lender_profiles (
            business_name,
            rating
          )
        `)
        .eq('vendor_id', lenderId)
        .eq('status', 'active');

      if (offersError) throw offersError;
      setLoanOffers(offers || []);
    } catch (error) {
      console.error('Error loading loan offers:', error);
      toast.error('Error loading loan offers');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Lender Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lenderName}
              </h1>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {renderStars(lenderRating)}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {lenderRating.toFixed(1)} rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Offers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loanOffers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No active loan offers available from this lender.</p>
            </div>
          ) : (
            loanOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-4">{offer.name}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CircleDollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Amount Range</p>
                      <p className="font-medium">
                        R{offer.min_amount.toLocaleString()} - R{offer.max_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Term Length</p>
                      <p className="font-medium">
                        {offer.term_months} {offer.term_months === 1 ? 'month' : 'months'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-medium">{offer.interest_rate}% per month</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/apply/${offer.id}`)}
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Apply Now
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}