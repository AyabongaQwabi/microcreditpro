import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface TermSet {
  id: string;
  name: string;
  category: string;
  content: string;
  created_at: string;
}

const CATEGORIES = [
  'Repayment Terms',
  'Late Payment Fees',
  'Early Settlement',
  'Default Terms',
  'General Conditions',
];

export default function TermsManagement() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [termSets, setTermSets] = useState<TermSet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSet, setCurrentSet] = useState<TermSet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    content: '',
  });

  useEffect(() => {
    loadTermSets();
  }, []);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('You must be logged in to manage terms');
      return;
    }

    try {
      setIsLoading(true);

      const termsData = {
        ...formData,
        vendor_id: session.user.id, // Add vendor_id from authenticated user
      };

      const { error } = currentSet
        ? await supabase
            .from('terms_sets')
            .update(termsData)
            .eq('id', currentSet.id)
        : await supabase
            .from('terms_sets')
            .insert([termsData]);

      if (error) {
        console.error('Error saving terms set:', error);
        throw error;
      }

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

  const handleEdit = (set: TermSet) => {
    setCurrentSet(set);
    setFormData({
      name: set.name,
      category: set.category,
      content: set.content,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this terms set?')) return;

    try {
      const { error } = await supabase
        .from('terms_sets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Terms set deleted successfully');
      loadTermSets();
    } catch (error) {
      console.error('Error deleting terms set:', error);
      toast.error('Failed to delete terms set');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Terms & Conditions Sets</h2>
        <button
          onClick={() => {
            setCurrentSet(null);
            setFormData({ name: '', category: '', content: '' });
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Set
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {termSets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-lg shadow-md p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{set.name}</h3>
                  <span className="text-sm text-gray-500">{set.category}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(set)}
                    className="p-2 text-gray-600 hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="max-h-40 overflow-y-auto">
                  {set.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {currentSet ? 'Edit Terms Set' : 'Create New Terms Set'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Set Name
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={8}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    : currentSet
                    ? 'Update Set'
                    : 'Create Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}