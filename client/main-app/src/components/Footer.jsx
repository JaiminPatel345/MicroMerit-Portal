import React from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Twitter,
    Instagram,
    Facebook,
    ExternalLink
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center space-x-2 group">
                            {/*<div className="bg-blue-chill-600 p-2 rounded-lg group-hover:bg-blue-chill-500 transition-colors">*/}
                            {/*    <Shield className="w-6 h-6 text-white" />*/}
                            {/*</div>*/}
                            <img src={"/logo.png"} alt={"MicroMerit"}/>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-400">
                            India's first decentralized credential wallet. Empowering learners, issuers, and employers with secure, verifiable, and AI-powered skill data.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-blue-chill-400 transition-colors transform hover:scale-110">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-chill-400 transition-colors transform hover:scale-110">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-chill-400 transition-colors transform hover:scale-110">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-chill-400 transition-colors transform hover:scale-110">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Services</h3>
                        <ul className="space-y-4 text-sm">
                            <li>
                                <Link to="/wallet" className="hover:text-blue-chill-400 transition-colors flex items-center">
                                    Certificate Wallet
                                </Link>
                            </li>
                            <li>
                                <Link to="/roadmap" className="hover:text-blue-chill-400 transition-colors flex items-center">
                                    Skill Pathway
                                </Link>
                            </li>
                            <li>
                                <Link to="/verify" className="hover:text-blue-chill-400 transition-colors flex items-center">
                                    Credential Verification
                                </Link>
                            </li>
                            <li>
                                <Link to="/roadmap" className="hover:text-blue-chill-400 transition-colors flex items-center">
                                    AI Recommendation Engine
                                </Link>
                            </li>
                            <li>
                                <Link to="/issuer/login" className="hover:text-blue-chill-400 transition-colors flex items-center">
                                    Provider Portal
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources & Account */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Resources</h3>
                        <ul className="space-y-4 text-sm">
                            <li>
                                <Link to="/docs" className="hover:text-blue-chill-400 transition-colors">Documentation</Link>
                            </li>
                            <li>
                                <Link to="/api" className="hover:text-blue-chill-400 transition-colors">API Reference</Link>
                            </li>
                            <li>
                                <Link to="/faqs" className="hover:text-blue-chill-400 transition-colors">FAQs</Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-blue-chill-400 transition-colors">Learner Login</Link>
                            </li>
                            <li>
                                <Link to="/signup" className="hover:text-blue-chill-400 transition-colors">Create Account</Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="hover:text-blue-chill-400 transition-colors">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link to="/terms" className="hover:text-blue-chill-400 transition-colors">Terms of Service</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Contact Us</h3>
                        <ul className="space-y-4 text-sm">
                            <li>
                                <Link to="/contact" className="hover:text-blue-chill-400 transition-colors mb-2 block">Contact Support</Link>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-blue-chill-500 flex-shrink-0" />
                                <span>BVM, Anand, Gujarat 388120</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Mail className="w-5 h-5 text-blue-chill-500 flex-shrink-0" />
                                <a href="mailto:support@micromerit.com" className="hover:text-white transition-colors">support@micromerit.com</a>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-blue-chill-500 flex-shrink-0" />
                                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {currentYear} MicroMerit. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Systems Operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
