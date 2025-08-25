import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GDPR Compliance | Irish Auto Market',
  description: 'Learn about your data protection rights under GDPR and how Irish Auto Market ensures full compliance with European data protection laws.',
  robots: 'index, follow'
}

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">GDPR Compliance</h1>
            <p className="text-sm text-gray-600 mb-8"><strong>Last updated: August 25, 2025</strong></p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Irish Auto Market is committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR) and Irish data protection laws. This page explains your rights and how we protect your personal data.
            </p>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">🛡️ Our GDPR Commitment</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside text-blue-700 space-y-2">
                  <li><strong>Transparency</strong>: Clear information about data use</li>
                  <li><strong>Lawful Processing</strong>: Legal basis for all processing</li>
                  <li><strong>Data Minimization</strong>: Only collect necessary data</li>
                  <li><strong>Accuracy</strong>: Keep data accurate and up to date</li>
                </ul>
                <ul className="list-disc list-inside text-blue-700 space-y-2">
                  <li><strong>Storage Limitation</strong>: Retain only as long as needed</li>
                  <li><strong>Security</strong>: Appropriate technical measures</li>
                  <li><strong>Accountability</strong>: Demonstrate compliance</li>
                  <li><strong>Your Rights</strong>: Respect all GDPR rights</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Data Controller Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <p className="text-gray-700 mb-2"><strong>Business Owner</strong>: Brian [Your Last Name]</p>
              <p className="text-gray-700 mb-2"><strong>Trading As</strong>: Irish Auto Market</p>
              <p className="text-gray-700 mb-2"><strong>Address</strong>: 26 Upper Pembroke Street, Dublin 2, D02X361, Ireland</p>
              <p className="text-gray-700 mb-2"><strong>Email</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
              <p className="text-gray-700 mb-2"><strong>Phone</strong>: <a href="tel:+353871708603" className="text-blue-600 hover:underline">+353 871708603</a></p>
              <p className="text-gray-700"><strong>Privacy Contact</strong>: <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a></p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Your GDPR Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Under GDPR, you have comprehensive rights regarding your personal data:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Right to Information</h3>
                <p className="text-gray-600 text-sm mb-3">You have the right to know:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>What personal data we collect</li>
                  <li>Why we process it</li>
                  <li>How long we keep it</li>
                  <li>Who we share it with</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Right of Access</h3>
                <p className="text-gray-600 text-sm mb-3">You can request:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Confirmation we process your data</li>
                  <li>Copy of your data</li>
                  <li>Information about processing</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>How</strong>: Email info@irishautomarket.ie
                </p>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">✏️ Right to Rectification</h3>
                <p className="text-gray-600 text-sm mb-3">You can request correction of:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Inaccurate personal data</li>
                  <li>Incomplete personal data</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>How</strong>: Update your profile or contact us
                </p>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🗑️ Right to Erasure</h3>
                <p className="text-gray-600 text-sm mb-3">"Right to be forgotten" when:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Data no longer necessary</li>
                  <li>You withdraw consent</li>
                  <li>Unlawful processing</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>How</strong>: Email "Data Deletion Request"
                </p>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">⏸️ Right to Restrict Processing</h3>
                <p className="text-gray-600 text-sm mb-3">Request restriction when:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Contesting data accuracy</li>
                  <li>Processing is unlawful</li>
                  <li>We no longer need the data</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📦 Right to Data Portability</h3>
                <p className="text-gray-600 text-sm mb-3">Request your data in:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Structured format (JSON/CSV)</li>
                  <li>Machine-readable format</li>
                  <li>When processing is automated</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-green-800 mb-3">⚖️ Right to Object</h3>
              <p className="text-green-700 mb-3">You can object to processing based on:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside text-green-700 space-y-2">
                  <li><strong>Legitimate interests</strong>: Including profiling</li>
                  <li><strong>Direct marketing</strong>: Including profiling for marketing</li>
                </ul>
                <div className="text-sm text-green-600">
                  <p><strong>Marketing Opt-out</strong>: Use unsubscribe link in emails or contact us directly</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How to Exercise Your Rights</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-3">📧</div>
                <h3 className="font-semibold text-gray-800 mb-2">Email Requests</h3>
                <p className="text-sm text-gray-600 mb-3">Send requests to:</p>
                <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline font-medium">info@irishautomarket.ie</a>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-800 mb-2">Response Time</h3>
                <p className="text-sm text-gray-600">
                  <strong>Standard</strong>: Within 1 month<br/>
                  <strong>Complex</strong>: Up to 3 months<br/>
                  <strong>Urgent</strong>: Within 72 hours
                </p>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-800 mb-2">What to Include</h3>
                <p className="text-sm text-gray-600">
                  Full name & email<br/>
                  Clear description<br/>
                  Proof of identity<br/>
                  Account username
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Legal Basis for Processing</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">✅ Consent</h3>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-2">
                  <li>Marketing communications</li>
                  <li>Optional website features</li>
                  <li>Third-party integrations</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  <strong>Note</strong>: You can withdraw consent at any time
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">📝 Contract Performance</h3>
                <ul className="list-disc list-inside text-purple-700 text-sm space-y-2">
                  <li>Account creation and management</li>
                  <li>Vehicle listing services</li>
                  <li>Communication between users</li>
                  <li>Payment processing</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">⚖️ Legitimate Interests</h3>
                <ul className="list-disc list-inside text-orange-700 text-sm space-y-2">
                  <li>Website security and fraud prevention</li>
                  <li>Service improvement and analytics</li>
                  <li>Customer support</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-3">📜 Legal Obligation</h3>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-2">
                  <li>Tax and accounting records</li>
                  <li>Anti-money laundering compliance</li>
                  <li>Consumer protection law</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security Measures</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔒 Technical Measures</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><strong>Encryption</strong>: TLS 1.3 in transit, AES-256 at rest</li>
                  <li><strong>Access Controls</strong>: Multi-factor authentication</li>
                  <li><strong>Security Testing</strong>: Regular vulnerability assessments</li>
                  <li><strong>Secure Development</strong>: Security-by-design principles</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">👥 Organizational Measures</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><strong>Staff Training</strong>: Regular GDPR training</li>
                  <li><strong>Access Policies</strong>: Need-to-know principles</li>
                  <li><strong>Incident Response</strong>: Breach response procedures</li>
                  <li><strong>Vendor Management</strong>: Due diligence for processors</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Breach Response</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🚨 Our Commitments</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside text-yellow-700 space-y-2">
                  <li><strong>72-hour notification</strong> to Irish DPC (where required)</li>
                  <li><strong>Prompt user notification</strong> for high-risk breaches</li>
                </ul>
                <ul className="list-disc list-inside text-yellow-700 space-y-2">
                  <li><strong>Transparent communication</strong> about incidents</li>
                  <li><strong>Remedial action</strong> to prevent future incidents</li>
                </ul>
              </div>
              <p className="text-yellow-700 mt-4">
                <strong>Report security issues to</strong>: <a href="mailto:info@irishautomarket.ie" className="underline">info@irishautomarket.ie</a>
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Supervisory Authority</h2>
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🇮🇪 Irish Data Protection Commission (DPC)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-blue-700 mb-2"><strong>Address</strong>:</p>
                  <p className="text-blue-700 text-sm mb-4">
                    21 Fitzwilliam Square South<br/>
                    Dublin 2, D02RD28<br/>
                    Ireland
                  </p>
                  <p className="text-blue-700 mb-2"><strong>Contact</strong>:</p>
                  <p className="text-blue-700 text-sm">
                    Phone: +353 (0)761 104 800<br/>
                    Lo Call: 1890 252231<br/>
                    Email: info@dataprotection.ie
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 mb-2"><strong>When to Contact DPC</strong>:</p>
                  <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                    <li>Unsatisfied with our response</li>
                    <li>Believe we're processing unlawfully</li>
                    <li>Data security concerns</li>
                    <li>Need independent advice</li>
                  </ul>
                  <p className="text-blue-700 text-sm mt-3">
                    <strong>Website</strong>: <a href="https://www.dataprotection.ie" className="underline" target="_blank" rel="noopener noreferrer">www.dataprotection.ie</a>
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. International Data Transfers</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🇪🇺 Within EU/EEA</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Most data processing occurs within the EU/EEA, primarily in Ireland.
                </p>
                <p className="text-gray-600 text-xs">
                  Full GDPR protection applies to all EU/EEA processing.
                </p>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🌍 Outside EU/EEA</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Limited transfers to third countries with appropriate safeguards:
                </p>
                <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                  <li><strong>Google Analytics</strong>: Adequacy decision + SCC</li>
                  <li><strong>Payment Processors</strong>: Standard Contractual Clauses</li>
                  <li><strong>Additional Measures</strong>: IP anonymization, encryption</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Privacy by Design</h2>
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-green-800 mb-3">🏗️ Built-in Privacy Protection</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">System Design</h4>
                  <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                    <li>Data minimization built-in</li>
                    <li>Privacy-protective defaults</li>
                    <li>Integrated consent management</li>
                    <li>Automatic retention policies</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Feature Development</h4>
                  <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                    <li>Privacy Impact Assessments</li>
                    <li>DPO review for high-risk processing</li>
                    <li>User control over data sharing</li>
                    <li>Transparent privacy notices</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Children's Privacy</h2>
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">👶 Special Protection for Minors</h3>
              <ul className="list-disc list-inside text-purple-700 space-y-2">
                <li>We do not knowingly process data of children under 16</li>
                <li>Age verification measures during registration</li>
                <li>Immediate deletion of accounts belonging to children</li>
                <li>Parental consent required for users aged 16-17 (where legally required)</li>
              </ul>
              <p className="text-purple-700 mt-4">
                If you believe a child has provided us with personal data, please contact us immediately at 
                <a href="mailto:info@irishautomarket.ie" className="underline ml-1">info@irishautomarket.ie</a>
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Compliance Monitoring</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Internal Audits</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><strong>Monthly</strong>: Data access and security reviews</li>
                  <li><strong>Quarterly</strong>: Privacy policy updates</li>
                  <li><strong>Annually</strong>: Comprehensive GDPR assessment</li>
                  <li><strong>Continuous</strong>: Regulatory change monitoring</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🏛️ External Validation</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><strong>Annual</strong>: Third-party privacy audits</li>
                  <li><strong>Legal Review</strong>: Data processing activities</li>
                  <li><strong>Penetration Testing</strong>: Security assessments</li>
                  <li><strong>Best Practice</strong>: Industry benchmarking</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact and Complaints</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📞 General Queries</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a>
                </p>
                <p className="text-sm text-gray-600">
                  <a href="tel:+353871708603" className="text-blue-600 hover:underline">+353 871708603</a>
                </p>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">🛡️ Privacy Inquiries</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a>
                </p>
                <p className="text-xs text-gray-500">Add "PRIVACY REQUEST" to subject line</p>
              </div>
              
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">⚠️ Security Issues</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <a href="mailto:info@irishautomarket.ie" className="text-blue-600 hover:underline">info@irishautomarket.ie</a>
                </p>
                <p className="text-xs text-gray-500">Add "SECURITY ISSUE" to subject line</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">📝 Complaint Process</h3>
              <ol className="list-decimal list-inside text-orange-700 space-y-2">
                <li><strong>Initial Contact</strong>: Reach out to our privacy team</li>
                <li><strong>Formal Investigation</strong>: We investigate within 30 days</li>
                <li><strong>Resolution</strong>: We work to resolve issues promptly and fairly</li>
                <li><strong>Escalation</strong>: If unsatisfied, contact the Irish Data Protection Commission</li>
                <li><strong>Documentation</strong>: All complaints tracked for compliance improvement</li>
              </ol>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Updates and Changes</h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📅 Change Management</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Significant changes</strong>: 30 days advance notice via email</li>
                <li><strong>Minor updates</strong>: Website notice and updated date</li>
                <li><strong>Legal requirement changes</strong>: Immediate implementation with prompt notification</li>
                <li><strong>Annual review</strong>: Comprehensive review of all privacy documentation</li>
              </ul>
            </div>

            <div className="mt-8 text-center p-6 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 mb-3">Summary</h2>
              <p className="text-blue-700 mb-4">
                Irish Auto Market is committed to the highest standards of data protection and privacy. 
                This GDPR compliance statement demonstrates our commitment to:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Respecting your rights under GDPR and Irish law</li>
                  <li>Protecting your data with appropriate measures</li>
                  <li>Providing transparency about our activities</li>
                  <li>Enabling control over your information</li>
                </ul>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Maintaining compliance with evolving regulations</li>
                  <li>Building trust through accountability</li>
                  <li>Ensuring your privacy is protected</li>
                  <li>Supporting your data protection rights</li>
                </ul>
              </div>
              <div className="mt-6 p-4 bg-blue-100 rounded">
                <p className="text-blue-800 font-medium">
                  Questions or Concerns? Our privacy team is here to help.
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  Contact us at <a href="mailto:info@irishautomarket.ie" className="underline">info@irishautomarket.ie</a> or call 
                  <a href="tel:+353871708603" className="underline ml-1">+353 871708603</a>
                </p>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                This document is part of our comprehensive privacy framework, including our Privacy Policy, 
                Cookie Policy, and Terms of Service. Together, these documents ensure full GDPR compliance 
                and protection of your personal data.
              </p>
              <p className="mt-2">
                <em>Last updated: August 25, 2025 | Next scheduled review: February 25, 2026</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}