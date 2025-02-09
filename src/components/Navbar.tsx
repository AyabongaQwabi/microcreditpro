import { Link, useNavigate } from 'react-router-dom';
import { CircleDollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { session, isLender } = useAuth();
  const navigate = useNavigate();

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

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <CircleDollarSign className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                MicroCredit Pro
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/lender"
              className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium dark:text-gray-300"
            >
              For Lenders
            </Link>
            {session ? (
              <>
                <Link
                  to={isLender ? "/vendor-dashboard" : "/dashboard"}
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium dark:text-gray-300"
                >
                  {isLender ? "Vendor Dashboard" : "Customer Dashboard"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium dark:text-gray-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}