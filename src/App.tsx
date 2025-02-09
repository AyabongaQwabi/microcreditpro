import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import LenderHomePage from './pages/LenderHomePage';
import LoginPage from './pages/LoginPage';
import RegisterCustomerPage from './pages/RegisterCustomerPage';
import RegisterLenderPage from './pages/RegisterLenderPage';
import BankDetailsPage from './pages/BankDetailsPage';
import PhysicalAddressPage from './pages/PhysicalAddressPage';
import DashboardPage from './pages/DashboardPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import FindLoanBusinessPage from './pages/FindLoanBusinessPage';
import LenderOffersPage from './pages/LenderOffersPage';
import LoanApplicationPage from './pages/LoanApplicationPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './hooks/useAuth';

function App() {
  const { session, loading, isLender } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lender" element={<LenderHomePage />} />
            <Route path="/find-lenders" element={<FindLoanBusinessPage />} />
            <Route path="/lender/:lenderId/offers" element={<LenderOffersPage />} />
            <Route path="/apply/:loanOfferId" element={
              session ? <LoanApplicationPage /> : <Navigate to="/login" replace />
            } />
            <Route
              path="/login"
              element={
                session ? (
                  <Navigate to={isLender ? "/vendor-dashboard" : "/dashboard"} replace />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route
              path="/register"
              element={
                session ? <Navigate to="/bank-details" replace /> : <RegisterCustomerPage />
              }
            />
            <Route
              path="/register-lender"
              element={
                session ? <Navigate to="/bank-details" replace /> : <RegisterLenderPage />
              }
            />
            <Route
              path="/bank-details"
              element={
                session ? <BankDetailsPage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/physical-address"
              element={
                session ? <PhysicalAddressPage /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/dashboard"
              element={
                session ? (
                  isLender ? (
                    <Navigate to="/vendor-dashboard" replace />
                  ) : (
                    <DashboardPage />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/vendor-dashboard/*"
              element={
                session ? (
                  isLender ? (
                    <VendorDashboardPage />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
    </Router>
  );
}

export default App;