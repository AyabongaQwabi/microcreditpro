import { Link } from 'react-router-dom';
import { CircleDollarSign, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center">
              <CircleDollarSign className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                MicroCredit Pro
              </span>
            </Link>
            <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
              Empowering businesses with smart lending solutions. Streamline your micro-lending operations with our comprehensive platform.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Product</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/features" className="text-base text-gray-500 hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-base text-gray-500 hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-base text-gray-500 hover:text-primary">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/about" className="text-base text-gray-500 hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-base text-gray-500 hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-base text-gray-500 hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-primary">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary">
              <Github className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary">
              <Linkedin className="h-6 w-6" />
            </a>
          </div>
          <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
            © 2024 MicroCredit Pro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}