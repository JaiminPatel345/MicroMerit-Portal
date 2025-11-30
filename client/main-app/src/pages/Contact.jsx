import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { setNotification } from '../utils/notification';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        setNotification('Message sent successfully! We will get back to you soon.', 'success');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have questions about MicroMerit? We're here to help. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Information */}
                    <div className="bg-blue-chill-600 rounded-2xl p-8 text-white shadow-lg h-fit">
                        <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <Mail className="w-6 h-6 mt-1" />
                                <div>
                                    <p className="font-medium">Email</p>
                                    <p className="text-blue-chill-100">support@micromerit.com</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <Phone className="w-6 h-6 mt-1" />
                                <div>
                                    <p className="font-medium">Phone</p>
                                    <p className="text-blue-chill-100">+91 8511633118</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <MapPin className="w-6 h-6 mt-1" />
                                <div>
                                    <p className="font-medium">Office</p>
                                    <p className="text-blue-chill-100">
                                        109 Shreekar<br />
                                        Vallbh Vidyanagar, Gujarat, India
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent outline-none transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent outline-none transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent outline-none transition-colors"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="6"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-chill-500 focus:border-transparent outline-none transition-colors resize-none"
                                    placeholder="Tell us more about your inquiry..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-chill-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-chill-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>Send Message</span>
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
