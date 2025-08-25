import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Irish Auto Market',
  description: 'Learn how Irish Auto Market protects your privacy and handles your personal data in compliance with GDPR and Irish law.',
  robots: 'index, follow'
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            <p className="text-sm text-gray-600 mb-8"><strong>Last updated: August 25, 2025</strong></p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Irish Auto Market Ltd. ("we," "our," or "us") operates the website www.irishautomarket.ie (the "Service"). This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">When you register or use our Service, we may collect:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Contact Information</strong>: Name, email address, phone number</li>
              <li><strong>Account Information</strong>: Username, password (encrypted), profile details</li>
              <li><strong>Location Data</strong>: Address, county, preferred search areas</li>
              <li><strong>Vehicle Information</strong>: Details about cars you're selling or interested in</li>
              <li><strong>Communication Data</strong>: Messages sent through our platform</li>
              <li><strong>Payment Information</strong>: Billing details for premium services (processed securely)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Technical Data</strong>: IP address, browser type, device information</li>
              <li><strong>Usage Data</strong>: Pages visited, time spent, search queries</li>
              <li><strong>Cookies and Tracking</strong>: As described in our Cookie Policy</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your personal data to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Provide our Service</strong>: Create accounts, list vehicles, facilitate communications</li>
              <li><strong>Improve our Platform</strong>: Analyze usage patterns, enhance features</li>
              <li><strong>Customer Support</strong>: Respond to inquiries and resolve issues</li>
              <li><strong>Marketing Communications</strong>: Send relevant updates (with your consent)</li>
              <li><strong>Legal Compliance</strong>: Meet regulatory requirements and prevent fraud</li>
              <li><strong>Security</strong>: Protect against unauthorized access and abuse</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Legal Basis for Processing (GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Under GDPR, we process your data based on:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Consent</strong>: Marketing communications, optional features</li>
              <li><strong>Contract Performance</strong>: Providing our core services</li>
              <li><strong>Legitimate Interest</strong>: Platform security, fraud prevention, service improvement</li>
              <li><strong>Legal Obligation</strong>: Compliance with Irish and EU laws</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Your Rights Under GDPR</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Access</strong>: Request copies of your personal data</li>
              <li><strong>Rectification</strong>: Correct inaccurate information</li>
              <li><strong>Erasure</strong>: Delete your data ("right to be forgotten")</li>
              <li><strong>Restrict Processing</strong>: Limit how we use your data</li>
              <li><strong>Data Portability</strong>: Receive your data in a portable format</li>
              <li><strong>Object</strong>: Opt-out of certain processing activities</li>
              <li><strong>Withdraw Consent</strong>: For consent-based processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              To exercise these rights, contact us at <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a>
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We implement appropriate security measures including:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Encryption</strong>: Data encrypted in transit and at rest</li>
              <li><strong>Access Controls</strong>: Restricted access to authorized personnel only</li>
              <li><strong>Regular Audits</strong>: Security assessments and vulnerability testing</li>
              <li><strong>Incident Response</strong>: Procedures for handling data breaches</li>
              <li><strong>Staff Training</strong>: Regular security awareness training</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Business Owner</strong>: Brian</p>
              <p className="text-gray-700 mb-2"><strong>Trading As</strong>: Irish Auto Market</p>
              <p className="text-gray-700 mb-2"><strong>Email</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
              <p className="text-gray-700"><strong>Privacy Inquiries</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Supervisory Authority</strong>: If you have concerns about our data practices, you can contact the Irish Data Protection Commission at <a href="https://www.dataprotection.ie" className="underline" target="_blank" rel="noopener noreferrer">www.dataprotection.ie</a>
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                This Privacy Policy is designed to comply with GDPR and Irish data protection laws. 
                For the complete detailed policy, please contact our Data Protection team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}