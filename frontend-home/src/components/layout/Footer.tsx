 
import { FC } from 'react';
import { Link } from 'react-router-dom';

const Footer: FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">WildRandom</h3>
            <p className="text-sm">
              Experience the thrill of transparent, fair, and exciting raffles.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/raffles" className="text-sm hover:text-indigo-400 transition-colors">
                  Active Raffles
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm hover:text-indigo-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/winners" className="text-sm hover:text-indigo-400 transition-colors">
                  Recent Winners
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-sm hover:text-indigo-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-indigo-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm hover:text-indigo-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/responsible-gaming" className="text-sm hover:text-indigo-400 transition-colors">
                  Responsible Gaming
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="text-sm hover:text-indigo-400 transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} WildRandom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;