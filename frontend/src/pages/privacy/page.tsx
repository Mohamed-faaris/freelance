import { useState, type FC } from "react";
import { Link } from "react-router-dom";

/* ---------- ARGUS logo component ---------- */
const ArgusLogo: FC = () => (
  <div className="text-lg font-bold text-blue-600 font-sans">ARGUS</div>
);

/* ---------- Table of Contents ---------- */
const TableOfContents: FC<{ onSectionClick: (id: string) => void }> = ({
  onSectionClick,
}) => {
  const sections = [
    { id: "information-we-collect", title: "Information we collect" },
    { id: "why-we-collect", title: "Why we collect data" },
    { id: "how-we-use", title: "How we use your information" },
    { id: "sharing-information", title: "When we share information" },
    { id: "keeping-secure", title: "Keeping your information secure" },
    { id: "data-retention", title: "Data retention" },
    { id: "your-privacy-controls", title: "Your privacy controls" },
    { id: "compliance", title: "Compliance & cooperation" },
    { id: "changes", title: "When this policy applies" },
    { id: "contact", title: "Contact us" },
  ];

  return (
    <div className="bg-gray-50 p-6 rounded-lg sticky top-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Contents</h3>
      <nav className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
          >
            {section.title}
          </button>
        ))}
      </nav>
    </div>
  );
};

/* ---------- Privacy Page ---------- */
export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("");

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <ArgusLogo />
          </Link>
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TableOfContents onSectionClick={scrollToSection} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-4xl font-normal text-gray-900 mb-2">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Last updated: January 15, 2024
              </p>

              <p className="text-lg text-gray-700 mb-8">
                When you use ARGUS services, you trust us with your information.
                This Privacy Policy is meant to help you understand what data we
                collect, why we collect it, and what we do with it. This is
                important; we hope you will take time to read it carefully.
              </p>

              {/* Information we collect */}
              <section id="information-we-collect" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Information we collect
                </h2>
                <p className="mb-4">
                  We want you to understand the types of information we collect
                  as you use our services.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Things you create or provide to us
                </h3>
                <p className="mb-4">
                  When you create an ARGUS Account, you provide us with personal
                  information that includes your name and email address. You can
                  also choose to add other information to your account, such as
                  profile information.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Information we collect as you use our services
                </h3>
                <p className="mb-4">
                  We collect information about the services that you use and how
                  you use them, including:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Your activity on our services, such as searches you perform
                    and content you view
                  </li>
                  <li>
                    Device information, including hardware model, operating
                    system version, and mobile network information
                  </li>
                  <li>
                    Log information, including details of how you used our
                    service, device event information, and your IP address
                  </li>
                  <li>
                    Location information when you use location-enabled services
                  </li>
                </ul>
              </section>

              {/* Why we collect data */}
              <section id="why-we-collect" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Why we collect data
                </h2>
                <p className="mb-4">
                  We collect data to build better services for all our users. We
                  use the information we collect from all our services for the
                  following purposes:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Provide our services and maintain account security</li>
                  <li>Develop new features and improve existing services</li>
                  <li>Provide personalized content and recommendations</li>
                  <li>Measure performance and provide analytics</li>
                  <li>Communicate with you about our services</li>
                </ul>
              </section>

              {/* How we use your information */}
              <section id="how-we-use" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  How we use your information
                </h2>
                <p className="mb-4">
                  We use the information we collect to provide, maintain,
                  protect and improve our services, to develop new ones, and to
                  protect ARGUS and our users.
                </p>
                <p className="mb-4">
                  We will ask for your consent before using information for a
                  purpose other than those that are set out in this Privacy
                  Policy.
                </p>
              </section>

              {/* When we share information */}
              <section id="sharing-information" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  When we share information
                </h2>
                <p className="mb-4">
                  We do not share personal information with companies,
                  organizations and individuals outside of ARGUS unless one of
                  the following circumstances applies:
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  With your consent
                </h3>
                <p className="mb-4">
                  We will share personal information with companies,
                  organizations or individuals outside of ARGUS when we have
                  your consent to do so.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  For legal reasons
                </h3>
                <p className="mb-4">
                  We will share personal information with companies,
                  organizations or individuals outside of ARGUS if we have a
                  good-faith belief that access, use, preservation or disclosure
                  of the information is reasonably necessary to meet any
                  applicable law, regulation, legal process or enforceable
                  governmental request.
                </p>
              </section>

              {/* Keeping your information secure */}
              <section id="keeping-secure" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Keeping your information secure
                </h2>
                <p className="mb-4">
                  We build security into our services to protect your
                  information. All data is encrypted in transit and at rest. We
                  regularly review our information collection, storage and
                  processing practices, including physical security measures, to
                  guard against unauthorized access to systems.
                </p>
                <p className="mb-4">
                  We restrict access to personal information to ARGUS employees,
                  contractors and agents who need to know that information in
                  order to process it for us, and who are subject to strict
                  contractual confidentiality obligations.
                </p>
              </section>

              {/* Data retention */}
              <section id="data-retention" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Data retention
                </h2>
                <p className="mb-4">
                  We keep your data for as long as your account is active or as
                  needed to provide you services. We also keep some data for
                  longer periods of time when required by law or for legitimate
                  business purposes.
                </p>
                <p className="mb-4">
                  When you delete your account, we begin a process to safely and
                  completely delete your data from our storage systems within 30
                  days, unless we need to keep it for legal reasons.
                </p>
              </section>

              {/* Your privacy controls */}
              <section id="your-privacy-controls" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Your privacy controls
                </h2>
                <p className="mb-4">
                  You have choices regarding the information we collect and how
                  it's used. You can:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Review and update your account information</li>
                  <li>Control what information you share</li>
                  <li>Export your data</li>
                  <li>Delete your account and data</li>
                </ul>
                <p className="mb-4">
                  You can make these choices by visiting your account settings
                  or contacting us directly.
                </p>
              </section>

              {/* Compliance */}
              <section id="compliance" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Compliance & cooperation with regulatory authorities
                </h2>
                <p className="mb-4">
                  We regularly review our compliance with this Privacy Policy.
                  When we receive formal written complaints, we will contact the
                  person who made the complaint to follow up.
                </p>
                <p className="mb-4">
                  We comply with applicable data protection laws, including GDPR
                  for European users and CCPA for California residents.
                </p>
              </section>

              {/* When this policy applies */}
              <section id="changes" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  When this policy applies
                </h2>
                <p className="mb-4">
                  This Privacy Policy applies to all of the services offered by
                  ARGUS and its affiliates. This Privacy Policy doesn't apply to
                  services that have separate privacy policies that do not
                  incorporate this Privacy Policy.
                </p>
                <p className="mb-4">
                  We change this Privacy Policy from time to time. We will not
                  reduce your rights under this Privacy Policy without your
                  explicit consent. We will post any privacy policy changes on
                  this page.
                </p>
              </section>

              {/* Contact */}
              <section id="contact" className="mb-12">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">
                  Contact us
                </h2>
                <p className="mb-4">
                  If you have questions about this Privacy Policy or about
                  ARGUS's privacy practices, you can contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">
                    <strong>Email:</strong> privacy@argus.com
                  </p>
                  <p className="mb-2">
                    <strong>Mail:</strong> ARGUS Privacy Office
                    <br />
                    123 Business St.
                    <br />
                    City, State 12345
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-6">
              <Link
                href="/help"
                className="hover:text-gray-700 transition-colors duration-200"
              >
                Help
              </Link>
              <Link
                href="/privacy"
                className="hover:text-gray-700 transition-colors duration-200"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-gray-700 transition-colors duration-200"
              >
                Terms
              </Link>
            </div>
            <p>© 2024 ARGUS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
