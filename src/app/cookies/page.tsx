import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Irish Auto Market',
  description: 'Learn about how Irish Auto Market uses cookies to improve your browsing experience and provide better services.',
  robots: 'index, follow'
}

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
            <p className="text-sm text-gray-600 mb-8"><strong>Last updated: August 25, 2025</strong></p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              This Cookie Policy explains how Irish Auto Market ("we," "us," or "our") uses cookies and similar technologies on our website www.irishautomarket.ie (the "Service").
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences, improve your experience, and provide analytics information to help us improve our service.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Types of Cookies</h3>
                <ul className="list-disc list-inside text-blue-700 space-y-2">
                  <li><strong>Session Cookies</strong>: Expire when you close your browser</li>
                  <li><strong>Persistent Cookies</strong>: Remain until manually deleted</li>
                  <li><strong>First-Party Cookies</strong>: Set by our website directly</li>
                  <li><strong>Third-Party Cookies</strong>: Set by external services</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Cookie Categories</h3>
                <ul className="list-disc list-inside text-green-700 space-y-2">
                  <li><strong>Essential</strong>: Required for website function</li>
                  <li><strong>Performance</strong>: Analytics and improvements</li>
                  <li><strong>Functional</strong>: Remember preferences</li>
                  <li><strong>Marketing</strong>: Advertising and targeting</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Essential Cookies (Always Active)</h3>
            <p className="text-gray-700 mb-4">These cookies are necessary for the website to function properly:</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_session</td>
                    <td className="border border-gray-300 px-4 py-2">User authentication and session management</td>
                    <td className="border border-gray-300 px-4 py-2">Session</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_csrf</td>
                    <td className="border border-gray-300 px-4 py-2">Security protection against attacks</td>
                    <td className="border border-gray-300 px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_auth</td>
                    <td className="border border-gray-300 px-4 py-2">Remember login status</td>
                    <td className="border border-gray-300 px-4 py-2">30 days</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono">cookie_consent</td>
                    <td className="border border-gray-300 px-4 py-2">Remember your cookie preferences</td>
                    <td className="border border-gray-300 px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Performance & Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">Help us understand how you use our website (with your consent):</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Provider</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono">_ga, _ga_*</td>
                    <td className="border border-gray-300 px-4 py-2">Google Analytics - user identification</td>
                    <td className="border border-gray-300 px-4 py-2">Google</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_analytics</td>
                    <td className="border border-gray-300 px-4 py-2">Internal analytics tracking</td>
                    <td className="border border-gray-300 px-4 py-2">Irish Auto Market</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Functionality Cookies</h3>
            <p className="text-gray-700 mb-4">Remember your preferences to improve your experience:</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cookie Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_preferences</td>
                    <td className="border border-gray-300 px-4 py-2">Remember search filters and preferences</td>
                    <td className="border border-gray-300 px-4 py-2">3 months</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_location</td>
                    <td className="border border-gray-300 px-4 py-2">Remember preferred location/county</td>
                    <td className="border border-gray-300 px-4 py-2">6 months</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-mono">iam_view_mode</td>
                    <td className="border border-gray-300 px-4 py-2">Remember list/grid view preference</td>
                    <td className="border border-gray-300 px-4 py-2">1 month</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              We use reputable third-party services that may set their own cookies:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Google Analytics</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><strong>Purpose</strong>: Website analytics and performance</li>
                  <li><strong>Data</strong>: Page views, user interactions, device info</li>
                  <li><strong>Privacy Policy</strong>: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy</a></li>
                  <li><strong>Opt-out</strong>: <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Opt-out</a></li>
                </ul>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">💳 Payment Processors</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><strong>Services</strong>: Stripe, PayPal</li>
                  <li><strong>Purpose</strong>: Secure payment processing</li>
                  <li><strong>Data</strong>: Payment-related information</li>
                  <li><strong>Active</strong>: Only during payment processes</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Managing Your Cookie Preferences</h2>

            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔧 Your Choices</h3>
              <p className="text-yellow-700 mb-3">You can manage your cookie preferences at any time:</p>
              <ol className="list-decimal list-inside text-yellow-700 space-y-2">
                <li><strong>Cookie Banner</strong>: Choose preferences when first visiting</li>
                <li><strong>Cookie Settings</strong>: Update via the link in our footer</li>
                <li><strong>Browser Settings</strong>: Configure cookies in your browser</li>
                <li><strong>Contact Us</strong>: Email info@irishautomarket.ie</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Browser Cookie Controls</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Google Chrome</h4>
                <p className="text-sm text-gray-600">Settings → Privacy and Security → Cookies and other site data</p>
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Firefox</h4>
                <p className="text-sm text-gray-600">Settings → Privacy & Security → Cookies and Site Data</p>
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Safari</h4>
                <p className="text-sm text-gray-600">Preferences → Privacy → Manage Website Data</p>
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Microsoft Edge</h4>
                <p className="text-sm text-gray-600">Settings → Cookies and site permissions</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Impact of Disabling Cookies</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Essential Cookies Disabled</h3>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-2">
                  <li>Cannot log into your account</li>
                  <li>Security features may not function</li>
                  <li>Shopping cart/saved preferences lost</li>
                  <li>Website may not load correctly</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">📊 Analytics Cookies Disabled</h3>
                <ul className="list-disc list-inside text-orange-700 text-sm space-y-2">
                  <li>Cannot improve website based on usage</li>
                  <li>Loading times may not be optimized</li>
                  <li>Error reporting limited</li>
                  <li>Less personalized experience</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Cookie data is retained for different periods:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Session Cookies</strong>: Deleted when you close your browser</li>
              <li><strong>Authentication Cookies</strong>: Up to 30 days or until logout</li>
              <li><strong>Preference Cookies</strong>: 3-12 months depending on type</li>
              <li><strong>Analytics Cookies</strong>: Up to 2 years (anonymized after 14 months)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Data Protection Team</strong>:</p>
              <p className="text-gray-700 mb-2"><strong>Email</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
              <p className="text-gray-700 mb-2"><strong>Phone</strong>: <a href="tel:+353871708603" className="text-blue-600 hover:underline">+353 871708603</a></p>
              <p className="text-gray-700"><strong>Address</strong>: 26 Upper Pembroke Street, Dublin 2, D02X361, Ireland</p>
            </div>

            <div className="mt-8 text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                This Cookie Policy is part of our Privacy Policy and Terms of Service. By using our website, 
                you acknowledge that you understand how we use cookies and agree to our practices as described above.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Last reviewed: August 25, 2025 | Next review: February 25, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}