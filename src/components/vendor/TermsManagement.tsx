import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

// ... (keep interfaces)

export default function TermsManagement() {
  const { session } = useAuth();
  // ... (keep other state)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (!session?.user?.id) {
        toast.error('You must be logged in to create terms sets');
        return;
      }

      const termsData = {
        ...formData,
        vendor_id: session.user.id,
      };

      const { error } = currentSet
        ? await supabase
            .from('terms_sets')
            .update(termsData)
            .eq('id', currentSet.id)
        : await supabase
            .from('terms_sets')
            .insert([termsData]);

      if (error) throw error;

      toast.success(
        currentSet
          ? 'Terms set updated successfully'
          : 'New terms set created successfully'
      );
      
      setShowModal(false);
      loadTermSets();
    } catch (error) {
      console.error('Error saving terms set:', error);
      toast.error('Failed to save terms set');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (keep rest of the component)
}