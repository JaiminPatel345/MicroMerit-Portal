import React from 'react';
import { Plus } from './icons';


const CredentialTemplates = () => {
    const templates = [
        { id: 1, name: 'Course Completion Certificate', version: '1.2', status: 'Active', issuances: 4500 },
        { id: 2, name: 'Professional Certification', version: '3.0', status: 'Draft', issuances: 0 },
        { id: 3, name: 'Skill Badge: JavaScript', version: '1.0', status: 'Active', issuances: 1200 },
    ];


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Available Credential Templates</h3>
                <button className="flex items-center bg-blue-chill-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-chill-700 transition duration-200">
                    <Plus className="w-5 h-5 mr-2" /> New Template
                </button>
            </div>


            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuances</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((t) => (
                            <tr key={t.id} className="hover:bg-blue-chill-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.version}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.issuances.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-blue-chill-600 hover:text-blue-chill-900 mr-4">Edit</button>
                                    <button className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-sm text-gray-500 pt-4">This section allows you to design and manage the visual and data structure of your digital credentials.</p>
        </div>
    );
};
export default CredentialTemplates;