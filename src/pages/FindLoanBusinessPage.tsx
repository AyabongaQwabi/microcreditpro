import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, Phone, Mail, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// List of South African cities and their suburbs
const citySuburbs = {
  'Cape Town': [
    'Sea Point',
    'Green Point',
    'Camps Bay',
    'Woodstock',
    'Observatory',
    'Claremont',
    'Newlands',
    'Rondebosch',
    'Kenilworth',
    'Constantia'
  ],
  'Johannesburg': [
    'Sandton',
    'Rosebank',
    'Braamfontein',
    'Parktown',
    'Melville',
    'Randburg',
    'Fourways',
    'Midrand',
    'Soweto',
    'Alexandra'
  ],
  // ... (keep other cities)
};

// List of South African cities
const cities = Object.keys(citySuburbs);

export default function FindLoanBusinessPage() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSuburb, setSelectedSuburb] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [interestRate, setInterestRate] = useState<number | null>(null);
  const [repaymentTerm, setRepaymentTerm] = useState<number | null>(null);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get suburbs for selected city
  const availableSuburbs = useMemo(() => {
    return selectedCity ? citySuburbs[selectedCity as keyof typeof citySuburbs] : [];
  }, [selectedCity]);

  // Load lenders on component mount
  useEffect(() => {
    loadLenders();
  }, []);

  const loadLenders = async () => {
    try {
      const { data, error } = await supabase
        .from('lender_profiles')
        .select(`
          id,
          business_name,
          address,
          phone,
          email,
          loan_offers (
            interest_rate,
            term_months
          )
        `);

      if (error) {
        console.error('Error loading lenders:', error);
        toast.error('Error loading lenders');
        return;
      }

      // Transform the data to match the expected format
      const transformedData = data.map(lender => ({
        id: lender.id,
        name: lender.business_name,
        city: lender.address.split(',')[0].trim(),
        suburb: lender.address.split(',')[1]?.trim() || '',
        interestRate: lender.loan_offers[0]?.interest_rate || 0,
        repaymentTerm: lender.loan_offers[0]?.term_months || 0,
        rating: 4.5, // This should come from reviews in a real application
        phone: lender.phone,
        email: lender.email,
        location: [-26.2041, 28.0473], // This should come from geocoding the address
      }));

      setFilteredBusinesses(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading lenders');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset suburb when city changes
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setSelectedSuburb('');
  };

  const handleSearch = () => {
    let results = filteredBusinesses;

    if (selectedCity) {
      results = results.filter(
        business => business.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (selectedSuburb) {
      results = results.filter(
        business => business.suburb.toLowerCase() === selectedSuburb.toLowerCase()
      );
    }

    if (businessName) {
      results = results.filter(
        business => business.name.toLowerCase().includes(businessName.toLowerCase())
      );
    }

    if (interestRate) {
      results = results.filter(business => business.interestRate === interestRate);
    }

    if (repaymentTerm) {
      results = results.filter(business => business.repaymentTerm === repaymentTerm);
    }

    setFilteredBusinesses(results);
  };

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedSuburb('');
    setBusinessName('');
    setInterestRate(null);
    setRepaymentTerm(null);
    loadLenders();
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Find Loan Providers Near You
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Search and compare loan providers in your area to find the best rates and terms.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <select
                value={selectedCity}
                onChange={handleCityChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Suburb
              </label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
                disabled={!selectedCity}
              >
                <option value="">Select Suburb</option>
                {availableSuburbs.map((suburb) => (
                  <option key={suburb} value={suburb}>
                    {suburb}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Search business name"
                  className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate
              </label>
              <select
                value={interestRate || ''}
                onChange={(e) => setInterestRate(Number(e.target.value) || null)}
                className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="">Any Rate</option>
                {[10, 20, 30, 40, 50].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Repayment Term
              </label>
              <select
                value={repaymentTerm || ''}
                onChange={(e) => setRepaymentTerm(Number(e.target.value) || null)}
                className="w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="">Any Term</option>
                {[1, 2, 3].map((term) => (
                  <option key={term} value={term}>
                    {term} {term === 1 ? 'month' : 'months'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={handleSearch}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Search
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Results List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Loan Providers</h2>
            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600 dark:text-gray-300">No loan providers found matching your criteria.</p>
              </div>
            ) : (
              filteredBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{business.name}</h3>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{business.city}, {business.suburb}</span>
                      </div>
                    </div>
                    <div className="flex">{renderStars(business.rating)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate</span>
                      <p className="font-semibold">{business.interestRate}%</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Repayment Term</span>
                      <p className="font-semibold">{business.repaymentTerm} months</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{business.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{business.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={() => navigate(`/lender/${business.id}/offers`)}
                        className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Apply Here
                      </button>
                      <button
                        onClick={() => window.location.href = `/lenders/${business.id}`}
                        className="flex-1 border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary/5 transition-colors"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map View */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="h-[600px]">
              <MapContainer
                center={[-30.5595, 22.9375]} // Center of South Africa
                zoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredBusinesses.map((business) => (
                  <Marker
                    key={business.id}
                    position={business.location as [number, number]}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{business.name}</h3>
                        <p className="text-sm">{business.city}, {business.suburb}</p>
                        <p className="text-sm">Interest Rate: {business.interestRate}%</p>
                        <p className="text-sm">Term: {business.repaymentTerm} months</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => navigate(`/lender/${business.id}/offers`)}
                            className="flex-1 bg-primary text-white px-2 py-1 text-sm rounded-md hover:bg-primary/90 transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => window.location.href = `/lenders/${business.id}`}
                            className="flex-1 border border-primary text-primary px-2 py-1 text-sm rounded-md hover:bg-primary/5 transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}