import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

interface LoanOffer {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  term_months: number;
  terms_sets: string[];
  custom_terms: string;
  status: 'active' | 'inactive' | 'draft';
}

interface TermSet {
  id: string;
  name: string;
  category: string;
  content: string;
}

const INTEREST_RATES = [5, 7, 10, 15, 17, 20, 25, 30, 35, 40, 45, 50];
const TERM_MONTHS = [1, 2, 3, 4, 5, 6];

export default function LoanOfferManagement() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [termSets, setTermSets] = useState<TermSet[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<LoanOffer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    min_amount: '',
    max_amount: '',
    interest_rate: '',
    term_months: '',
    terms_sets: [] as string[],
    custom_terms: '',
    status: 'draft' as const,
  });

  useEffect(() => {
    if (session?.user?.id) {
      loadLoanOffers();
      loadTermSets();
    }
  }, [session?.user?.id]);

  const loadLoanOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_offers')
        .select('*')
        .eq('vendor_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanOffers(data || []);
    } catch (error) {
      console.error('Error loading loan offers:', error);
      toast.error('Failed to load loan offers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTermSets = async () => {
    try {
      const { data, error } = await supabase
        .from('terms_sets')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setTermSets(data || []);
    } catch (error) {
      console.error('Error loading term sets:', error);
      toast.error('Failed to load term sets');
    }
  };

  const handleEdit = (offer: LoanOffer) => {
    setCurrentOffer(offer);
    setFormData({
      name: offer.name,
      min_amount: offer.min_amount.toString(),
      max_amount: offer.max_amount.toString(),
      interest_rate: offer.interest_rate.toString(),
      term_months: offer.term_months.toString(),
      terms_sets: offer.terms_sets,
      custom_terms: offer.custom_terms,
      status: offer.status,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (offer: LoanOffer) => {
    setCurrentOffer(offer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!currentOffer || !session?.user?.id) return;

    try {
      setIsLoading(true);

      // First, archive the loan offer in deleted_loan_offers
      const { error: archiveError } = await supabase
        .from('deleted_loan_offers')
        .insert([
          {
            original_id: currentOffer.id,
            vendor_id: session.user.id,
            name: currentOffer.name,
            min_amount: currentOffer.min_amount,
            max_amount: currentOffer.max_amount,
            interest_rate: currentOffer.interest_rate,
            term_months: currentOffer.term_months,
            terms_sets: currentOffer.terms_sets,
            custom_terms: currentOffer.custom_terms,
            deletion_reason: 'Manually deleted by vendor',
            original_created_at: currentOffer.created_at,
          }
        ]);

      if (archiveError) throw archiveError;

      // Then delete the original loan offer
      const { error: deleteError } = await supabase
        .from('loan_offers')
        .delete()
        .eq('id', currentOffer.id);

      if (deleteError) throw deleteError;

      toast.success('Loan offer deleted successfully');
      setShowDeleteModal(false);
      setCurrentOffer(null);
      loadLoanOffers();
    } catch (error) {
      console.error('Error deleting loan offer:', error);
      toast.error('Failed to delete loan offer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('You must be logged in to manage loan offers');
      return;
    }

    try {
      setIsLoading(true);

      const offerData = {
        ...formData,
        vendor_id: session.user.id,
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        interest_rate: parseFloat(formData.interest_rate),
        term_months: parseInt(formData.term_months),
      };

      const { error } = currentOffer
        ? await supabase
            .from('loan_offers')
            .update(offerData)
            .eq('id', currentOffer.id)
        : await supabase
            .from('loan_offers')
            .insert([offerData]);

      if (error) throw error;

      toast.success(
        currentOffer
          ? 'Loan offer updated successfully'
          : 'New loan offer created successfully'
      );
      
      setShowCreateModal(false);
      setCurrentOffer(null);
      loadLoanOffers();
    } catch (error) {
      console.error('Error saving loan offer:', error);
      toast.error('Failed to save loan offer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Loan Offers</h2>
        <button
          onClick={() => {
            setCurrentOffer(null);
            setFormData({
              name: '',
              min_amount: '',
              max_amount: '',
              interest_rate: '',
              term_months: '',
              terms_sets: [],
              custom_terms: '',
              status: 'draft',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Offer
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loanOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-lg shadow-md p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{offer.name}</h3>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                      offer.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : offer.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="p-2 text-gray-600 hover:text-primary transition-colors"
                    title="Edit offer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Delete offer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Amount Range: R{offer.min_amount.toLocaleString()} - R{offer.max_amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Interest Rate: {offer.interest_rate}%
                </p>
                <p className="text-sm text-gray-600">
                  Term: {offer.term_months} {offer.term_months === 1 ? 'month' : 'months'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {currentOffer ? 'Edit Loan Offer' : 'Create New Loan Offer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Offer Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Amount (R)
                  </label>
                  <input
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        min_amount: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Amount (R)
                  </label>
                  <input
                    type="number"
                    value={formData.max_amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_amount: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interest Rate (%)
                  </label>
                  <select
                    value={formData.interest_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        interest_rate: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  >
                    <option value="">Select interest rate</option>
                    {INTEREST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Term (Months)
                  </label>
                  <select
                    value={formData.term_months}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        term_months: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  >
                    <option value="">Select term length</option>
                    {TERM_MONTHS.map((months) => (
                      <option key={months} value={months}>
                        {months} {months === 1 ? 'month' : 'months'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Terms & Conditions Sets
                </label>
                <select
                  multiple
                  value={formData.terms_sets}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      terms_sets: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  {termSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name} ({set.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Terms
                </label>
                <textarea
                  value={formData.custom_terms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      custom_terms: e.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as 'active' | 'inactive' | 'draft',
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCurrentOffer(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  {isLoading
                    ? 'Saving...'
                    : currentOffer
                    ? 'Update Offer'
                    : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-xl font-semibold">Delete Loan Offer</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{currentOffer.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCurrentOffer(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}