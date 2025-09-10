"use client";

import Link from "next/link";
import { type FC } from "react";

/* ---------- ARGUS logo component ---------- */
const ArgusLogo: FC = () => (
    <div className="text-lg font-bold text-blue-600 font-sans">
        ARGUS
    </div>
);

export default function TermsPage() {
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

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="prose prose-lg max-w-none">
                    <h1 className="text-4xl font-normal text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-lg text-gray-600 mb-8">Last updated: January 15, 2024</p>

                    <p className="text-lg text-gray-700 mb-8">
                        Welcome to ARGUS. These terms of service ("Terms") apply to your access and use of ARGUS (the "Service") provided by ARGUS Inc. ("we", "us", or "our").
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="mb-4">
                            By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">2. Use of the Service</h2>
                        <p className="mb-4">You may use our Service only as permitted by law and these Terms. You agree not to:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Use the Service for any unlawful purpose or to solicit others to perform illegal acts</li>
                            <li>Violate any international, federal, provincial, or state regulations, rules, or laws</li>
                            <li>Infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                            <li>Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">3. User Accounts</h2>
                        <p className="mb-4">
                            When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">4. Privacy Policy</h2>
                        <p className="mb-4">
                            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">5. Termination</h2>
                        <p className="mb-4">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">6. Limitation of Liability</h2>
                        <p className="mb-4">
                            In no event shall ARGUS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">7. Changes to Terms</h2>
                        <p className="mb-4">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">8. Contact Information</h2>
                        <p className="mb-4">
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-2"><strong>Email:</strong> legal@argus.com</p>
                            <p><strong>Address:</strong> ARGUS Inc., 123 Business St., City, State 12345</p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 mt-16">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-6">
                            <Link href="/help" className="hover:text-gray-700 transition-colors duration-200">
                                Help
                            </Link>
                            <Link href="/privacy" className="hover:text-gray-700 transition-colors duration-200">
                                Privacy
                            </Link>
                            <Link href="/terms" className="hover:text-gray-700 transition-colors duration-200">
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