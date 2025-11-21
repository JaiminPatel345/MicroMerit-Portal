import React from "react";
import { HelpCircle, Send, CheckCircle } from './icons';


const IssuerSupport = () => (
    <div className="max-w-3xl mx-auto space-y-8">
        <h3 className="text-2xl font-semibold text-gray-800 text-center">Need Help?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-xl shadow-md bg-blue-chill-50">
                <h4 className="text-xl font-semibold text-blue-chill-800 flex items-center mb-3">
                    <HelpCircle className="w-6 h-6 mr-2" /> Documentation
                </h4>
                <p className="text-gray-700">Find detailed guides and technical specifications for using our API and managing credentials.</p>
                <button className="mt-4 text-blue-chill-600 font-medium hover:underline">Go to Docs</button>
            </div>
            
            <div className="p-6 border rounded-xl shadow-md bg-white">
                <h4 className="text-xl font-semibold text-gray-800 flex items-center mb-3">
                    <Send className="w-6 h-6 mr-2" /> Contact Support
                </h4>
                <p className="text-gray-700">Open a ticket or contact our dedicated support team for technical assistance.</p>
                <button className="mt-4 text-blue-chill-600 font-medium hover:underline">Submit Ticket</button>
            </div>
        </div>
        
        <div className="p-6 border rounded-xl shadow-md bg-gray-50">
            <h4 className="text-xl font-semibold text-gray-800 mb-3">System Status</h4>
            <p className="text-sm text-green-600 font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> All Systems Operational</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
    </div>
);

export default IssuerSupport;