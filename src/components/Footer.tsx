import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/logo.png" 
                alt="Irish Auto Market Logo" 
                className="h-10 w-10"
              />
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold text-white">
                  IRISH
                </div>
                <div className="text-xl font-bold text-secondary">
                  AUTO MARKET
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Ireland's premier marketplace for quality used cars. Find your perfect vehicle from trusted dealers and private sellers across all 32 counties.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cars" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Browse Cars
                </Link>
              </li>
              <li>
                <Link href="/sell" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Sell Your Car
                </Link>
              </li>
              <li>
                <Link href="/dealers" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Find Dealers
                </Link>
              </li>
              <li>
                <Link href="/finance" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Car Finance
                </Link>
              </li>
              <li>
                <Link href="/insurance" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Car Insurance
                </Link>
              </li>
              <li>
                <Link href="/valuations" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Car Valuations
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Feedback
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p>Irish Auto Market Ltd.</p>
                  <p>123 O'Connell Street</p>
                  <p>Dublin 1, D01 F5P2</p>
                  <p>Ireland</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-secondary flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <a href="tel:+35318001234" className="hover:text-white transition-colors">
                    +353 1 800 1234
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <a href="mailto:info@irishautomarket.ie" className="hover:text-white transition-colors">
                    info@irishautomarket.ie
                  </a>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2 text-gray-200">Business Hours</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              © {currentYear} Irish Auto Market Ltd. All rights reserved.
            </div>
            
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/gdpr" className="text-gray-400 hover:text-white transition-colors">
                GDPR
              </Link>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 space-y-2 md:space-y-0">
              <div className="flex items-center space-x-4">
                <span>VAT: IE1234567890</span>
                <span>•</span>
                <span>Company Reg: 123456</span>
                <span>•</span>
                <span>Licensed by the Central Bank of Ireland</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Powered by</span>
                <span className="text-secondary font-medium">Irish Auto Market Technology</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}