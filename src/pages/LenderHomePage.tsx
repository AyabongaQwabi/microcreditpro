import { Link } from 'react-router-dom';
import { Shield, Zap, CircleDollarSign } from 'lucide-react';

export default function LenderHomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-6 py-16 mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2">
              <div className="lg:max-w-lg">
                <h1 className="text-3xl font-bold tracking-wide text-gray-800 dark:text-white lg:text-5xl">
                  Revolutionize Your
                  <span className="text-primary"> Micro-Lending</span> Business
                </h1>
                
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  Streamline your lending operations, automate collections, and grow your business with our comprehensive lending management platform.
                </p>

                <div className="grid gap-4 mt-8 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>Risk Assessment Tools</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                    <span>Automated Collections</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>Instant Disbursements</span>
                  </div>
                </div>

                <div className="mt-8 space-x-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Start Lending
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center w-full mt-6 lg:mt-0 lg:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Lending Dashboard Preview"
                className="w-full h-full lg:max-w-2xl rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}