import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Irish Auto Market',
  description: 'Read the Terms of Service for Irish Auto Market, including information about our free trial period and dealer services.',
  robots: 'index, follow'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            <p className="text-sm text-gray-600 mb-8"><strong>Last updated: August 25, 2025</strong></p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Welcome to Irish Auto Market Ltd. ("we," "us," or "our"). These Terms of Service ("Terms") govern your use of our website www.irishautomarket.ie and related services (collectively, the "Service").
            </p>

            <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-green-800 mb-4">🎉 Free Trial Terms</h2>
              <ul className="list-disc list-inside text-green-700 space-y-2">
                <li>3 months completely free with no obligations</li>
                <li>Full access to all dealer features and homepage placement</li>
                <li>After trial: flexible monthly subscriptions starting from €199/month</li>
                <li>Either party can cancel at any time with 30 days notice</li>
                <li>By registering, you agree to these Terms of Service</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              By creating an account or using our Service, you acknowledge that you have read and understood these Terms, are at least 18 years old, have the legal capacity to enter into this agreement, and will comply with all applicable laws and regulations.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Irish Auto Market is an online marketplace that connects buyers and sellers of motor vehicles in Ireland. Our Service includes:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Vehicle Listings</strong>: Platform for advertising cars, motorcycles, and commercial vehicles</li>
              <li><strong>Search and Discovery</strong>: Tools to find vehicles based on your criteria</li>
              <li><strong>Communication Tools</strong>: Messaging system between buyers and sellers</li>
              <li><strong>Dealer Services</strong>: Enhanced features for professional dealers</li>
              <li><strong>User Profiles</strong>: Account management and personalization features</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Account Registration</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>You must provide accurate, current, and complete information</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You must notify us immediately of any unauthorized use</li>
              <li>One person may not maintain multiple accounts without permission</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Account Types</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Private Sellers</strong>: Individual users selling personal vehicles</li>
              <li><strong>Dealers</strong>: Licensed motor dealers with enhanced features</li>
              <li><strong>Buyers</strong>: Users browsing and purchasing vehicles</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Vehicle Listings</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Listing Requirements</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Accuracy</strong>: All information must be truthful and complete</li>
              <li><strong>Ownership</strong>: You must own the vehicle or have authorization to sell</li>
              <li><strong>Photos</strong>: Images must accurately represent the vehicle</li>
              <li><strong>Pricing</strong>: Prices must be genuine (no fake pricing to attract views)</li>
              <li><strong>Location</strong>: Vehicle must be located where stated</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Prohibited Listings</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Stolen vehicles or vehicles with disputed ownership</li>
              <li>Vehicles with outstanding finance without proper disclosure</li>
              <li>Salvage, flood-damaged, or write-off vehicles without clear disclosure</li>
              <li>Vehicles that don't meet safety or emissions standards</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Payment Terms</h2>
            
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Free Trial Period</h3>
              <p className="text-blue-700 mb-2">New dealers receive:</p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>3 months free access to all features</li>
                <li>Homepage featured placement included</li>
                <li>No payment required during trial</li>
                <li>30 days notice required for cancellation</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Paid Services</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Premium Listings</strong>: Enhanced visibility and features</li>
              <li><strong>Dealer Subscriptions</strong>: Monthly or annual plans starting from €199/month</li>
              <li><strong>Featured Placement</strong>: Homepage and category featuring</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Acceptable Use</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">✅ You May</h3>
                <ul className="list-disc list-inside text-green-700 space-y-2">
                  <li>List genuine vehicles you own or are authorized to sell</li>
                  <li>Communicate respectfully with other users</li>
                  <li>Use our search and browsing features</li>
                  <li>Report suspicious or fraudulent activity</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-3">❌ You May Not</h3>
                <ul className="list-disc list-inside text-red-700 space-y-2">
                  <li>Post false, misleading, or fraudulent listings</li>
                  <li>Use automated systems (bots, scrapers)</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Account Termination</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Termination by You</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may delete your account at any time through your account settings. For trial accounts, 
              you can cancel with 30 days notice without any charges.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Termination by Us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We may suspend or terminate accounts for:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of fees (after trial period)</li>
              <li>Prolonged inactivity (after notice)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              These Terms are governed by Irish law and EU regulations. Irish courts have exclusive jurisdiction 
              over any disputes. Consumer rights under Irish/EU law are fully preserved.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Business Owner</strong>: Brian</p>
              <p className="text-gray-700 mb-2"><strong>Trading As</strong>: Irish Auto Market</p>
              <p className="text-gray-700 mb-2"><strong>Email</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
              <p className="text-gray-700"><strong>All Inquiries</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
            </div>
            <div className="mt-8 text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                By using Irish Auto Market, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}