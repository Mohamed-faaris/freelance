"use client";

import Link from "next/link";
import { type FC } from "react";

/* ---------- ARGUS logo component ---------- */
const ArgusLogo: FC = () => (
    <div className="text-lg font-bold text-blue-600 font-sans">
        ARGUS
    </div>
);

export default function HelpPage() {
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
                    <h1 className="text-4xl font-normal text-gray-900 mb-8">Help Center</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-medium text-gray-900 mb-4">Getting Started</h2>
                            <ul className="space-y-2 text-gray-700">
                                <li><a href="#account" className="text-blue-600 hover:underline">Creating an account</a></li>
                                <li><a href="#signin" className="text-blue-600 hover:underline">Signing in</a></li>
                                <li><a href="#profile" className="text-blue-600 hover:underline">Setting up your profile</a></li>
                            </ul>
                        </div>
                        
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-medium text-gray-900 mb-4">Account Management</h2>
                            <ul className="space-y-2 text-gray-700">
                                <li><a href="#password" className="text-blue-600 hover:underline">Changing your password</a></li>
                                <li><a href="#security" className="text-blue-600 hover:underline">Account security</a></li>
                                <li><a href="#delete" className="text-blue-600 hover:underline">Deleting your account</a></li>
                            </ul>
                        </div>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-2xl font-medium text-gray-900 mb-4">Frequently Asked Questions</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">How do I reset my password?</h3>
                                <p className="text-gray-700">You can reset your password by clicking the "Forgot Password" link on the sign-in page.</p>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">How do I contact support?</h3>
                                <p className="text-gray-700">You can reach our support team at support@argus.com or use the contact form below.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-blue-50 p-6 rounded-lg">
                        <h2 className="text-xl font-medium text-gray-900 mb-4">Need more help?</h2>
                        <p className="text-gray-700 mb-4">Can't find what you're looking for? Contact our support team.</p>
                        <p className="text-gray-700">
                            <strong>Email:</strong> support@argus.com<br />
                            <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}