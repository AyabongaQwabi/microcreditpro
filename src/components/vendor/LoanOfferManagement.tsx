import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

// ... (keep interfaces)

export default function LoanOfferManagement() {
  const { session } = useAuth();
  // ... (keep other state)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (!session?.user?.id) {
        toast.error('You must be logged in to create loan offers');
        return;
      }

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
      loadLoanOffers();
    } catch (error) {
      console.error('Error saving loan offer:', error);
      toast.error('Failed to save loan offer');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (keep rest of the component)
}