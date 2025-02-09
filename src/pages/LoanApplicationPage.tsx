import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { CircleDollarSign, Calendar, AlertCircle, ChevronRight, CheckCircle, HelpCircle, Phone, Mail, MessageSquare } from 'lucide-react';

interface LoanOffer {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  term_months: number;
  terms_sets: string[];
  custom_terms: string;
  lender: {
    business_name: string;
    rating: number;
  };
}

interface TermSet {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface RepaymentSchedule {
  date: string;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export default function LoanApplicationPage() {
  const { loanOfferId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loanOffer, setLoanOffer] = useState<LoanOffer | null>(null);
  const [termSets, setTermSets] = useState<TermSet[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedTerm, setSelectedTerm] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalRepayment, setTotalRepayment] = useState<number>(0);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState(1);
  const [eligibilityStatus, setEligibilityStatus] = useState<'pending' | 'eligible' | 'ineligible'>('pending');

  useEffect(() => {
    if (!session?.user) {
      toast.error('Please sign in to view loan offers');
      navigate('/login');
      return;
    }

    if (!loanOfferId) {
      toast.error('Invalid loan offer ID');
      navigate('/find-lenders');
      return;
    }

    loadLoanOffer();
  }, [session, loanOfferId]);

  const loadLoanOffer = async () => {
    try {
      // First check if the loan offer exists at all
      const { data: offerExists, error: existsError } = await supabase
        .from('loan_offers')
        .select('status')
        .eq('id', loanOfferId)
        .maybeSingle();

      if (existsError) throw existsError;

      if (!offerExists) {
        toast.error('Loan offer not found');
        navigate('/find-lenders');
        return;
      }

      if (offerExists.status !== 'active') {
        toast.error('This loan offer is no longer active');
        navigate('/find-lenders');
        return;
      }

      // Now load the full loan offer details
      const { data, error } = await supabase
        .from('loan_offers')
        .select(`
          *,
          lender:lender_profiles (
            business_name,
            rating
          )
        `)
        .eq('id', loanOfferId)
        .single();

      if (error) throw error;

      setLoanOffer(data);
      setSelectedAmount(data.min_amount);
      setSelectedTerm(data.term_months);

      // Load terms sets if any
      if (data.terms_sets?.length > 0) {
        const { data: termsData, error: termsError } = await supabase
          .from('terms_sets')
          .select('*')
          .in('id', data.terms_sets);

        if (termsError) {
          console.error('Error loading terms:', termsError);
          toast.error('Error loading loan terms');
          return;
        }
        
        setTermSets(termsData || []);
      }

      // Check eligibility
      await checkEligibility(data);
    } catch (error) {
      console.error('Error loading loan offer:', error);
      toast.error('Error loading loan offer details');
      navigate('/find-lenders');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEligibility = async (offer: LoanOffer) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('monthly_income, employment_status')
        .eq('id', session?.user?.id)
        .single();

      if (profileError) throw profileError;

      // Basic eligibility rules
      const monthlyIncome = profile?.monthly_income || 0;
      const employmentStatus = profile?.employment_status;
      const maxMonthlyPayment = monthlyIncome * 0.4; // 40% of monthly income
      const calculatedMonthlyPayment = calculateMonthlyPayment(selectedAmount, offer.interest_rate, offer.term_months);

      const isEligible = 
        employmentStatus !== 'unemployed' &&
        calculatedMonthlyPayment <= maxMonthlyPayment;

      setEligibilityStatus(isEligible ? 'eligible' : 'ineligible');
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setEligibilityStatus('ineligible');
    }
  };

  const calculateMonthlyPayment = (amount: number, interestRate: number, months: number) => {
    const monthlyRate = interestRate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  const calculateRepaymentSchedule = () => {
    if (!loanOffer) return;

    const monthlyRate = loanOffer.interest_rate / 100 / 12;
    const payment = calculateMonthlyPayment(selectedAmount, loanOffer.interest_rate, selectedTerm);
    let balance = selectedAmount;
    const schedule: RepaymentSchedule[] = [];
    const today = new Date();

    for (let i = 1; i <= selectedTerm; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance -= principal;

      const paymentDate = new Date(today);
      paymentDate.setMonth(today.getMonth() + i);

      schedule.push({
        date: paymentDate.toISOString().split('T')[0],
        amount: payment,
        principal,
        interest,
        remainingBalance: Math.max(0, balance)
      });
    }

    setRepaymentSchedule(schedule);
    setMonthlyPayment(payment);
    setTotalRepayment(payment * selectedTerm);
  };

  useEffect(() => {
    if (loanOffer && selectedAmount && selectedTerm) {
      calculateRepaymentSchedule();
    }
  }, [selectedAmount, selectedTerm, loanOffer]);

  const handleSubmit = async () => {
    if (!session?.user?.id || !loanOffer) {
      toast.error('Please sign in to apply for a loan');
      return;
    }

    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('loans')
        .insert([
          {
            customer_id: session.user.id,
            lender_id: loanOffer.lender.id,
            amount: selectedAmount,
            interest_rate: loanOffer.interest_rate,
            term_months: selectedTerm,
            status: 'pending',
            monthly_payment: monthlyPayment,
            total_repayment: totalRepayment,
          },
        ]);

      if (error) throw error;

      toast.success('Loan application submitted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting loan application:', error);
      toast.error('Error submitting loan application');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!loanOffer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loan Offer Not Found</h2>
          <p className="text-gray-600 mb-4">The loan offer you're looking for doesn't exist or has expired.</p>
          <button
            onClick={() => navigate('/find-lenders')}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Find Other Lenders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {['Loan Details', 'Terms & Conditions', 'Review & Submit'].map((stepName, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step > index + 1 ? 'bg-green-500' :
                  step === index + 1 ? 'bg-primary' : 'bg-gray-300'
                } text-white`}>
                  {step > index + 1 ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`ml-2 ${
                  step === index + 1 ? 'text-primary font-medium' : 'text-gray-500'
                }`}>
                  {stepName}
                </span>
                {index < 2 && (
                  <div className="mx-4 h-0.5 w-16 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lender Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {loanOffer.lender.business_name}
              </h1>
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(loanOffer.lender.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {loanOffer.lender.rating.toFixed(1)} rating
                </span>
              </div>
            </div>
            {eligibilityStatus !== 'pending' && (
              <div className={`px-4 py-2 rounded-full ${
                eligibilityStatus === 'eligible'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {eligibilityStatus === 'eligible' ? 'Eligible' : 'Not Eligible'}
              </div>
            )}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            {/* Loan Amount Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Select Loan Amount</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount (R{loanOffer.min_amount} - R{loanOffer.max_amount})
                  </label>
                  <input
                    type="range"
                    min={loanOffer.min_amount}
                    max={loanOffer.max_amount}
                    step={100}
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="mt-2 text-center text-lg font-semibold">
                    R{selectedAmount.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Term Length
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    {[...Array(loanOffer.term_months)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'month' : 'months'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Monthly Payment</div>
                  <div className="text-lg font-semibold">
                    R{monthlyPayment.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Repayment</div>
                  <div className="text-lg font-semibold">
                    R{totalRepayment.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Repayment Schedule */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Repayment Schedule</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Amount
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Principal
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {repaymentSchedule.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R{payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R{payment.principal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R{payment.interest.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R{payment.remainingBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Continue to Terms
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* Terms & Conditions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Terms & Conditions</h2>
              <div className="space-y-6">
                {termSets.map((termSet) => (
                  <div key={termSet.id} className="border-b pb-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {termSet.name}
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      {termSet.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-gray-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {loanOffer.custom_terms && (
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Additional Terms
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      {loanOffer.custom_terms.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-gray-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="accept-terms"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    I have read and agree to the terms and conditions
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!termsAccepted}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Review
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            {/* Review Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Review Your Application</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Loan Amount</h3>
                  <p className="mt-1 text-lg font-semibold">R{selectedAmount.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Term Length</h3>
                  <p className="mt-1 text-lg font-semibold">{selectedTerm} months</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Interest Rate</h3>
                  <p className="mt-1 text-lg font-semibold">{loanOffer.interest_rate}%</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monthly Payment</h3>
                  <p className="mt-1 text-lg font-semibold">R{monthlyPayment.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Repayment</h3>
                  <p className="mt-1 text-lg font-semibold">R{totalRepayment.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Interest</h3>
                  <p className="mt-1 text-lg font-semibold">
                    R{(totalRepayment - selectedAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <HelpCircle className="h-5 w-5 text-primary mr-2" />
                <h2 className="text-lg font-semibold">Need Help?</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  If you have any questions about your loan application or need assistance,
                  our customer support team is here to help:
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    Call us at: 0800 123 4567
                  </li>
                  <li className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    Email: support@microcreditpro.com
                  </li>
                  <li className="flex items-center text-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Live chat available Monday to Friday, 8am - 5pm
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !termsAccepted || eligibilityStatus !== 'eligible'}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}