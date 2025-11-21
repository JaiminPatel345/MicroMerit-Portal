import React from 'react';



const RecipientManagement = () => {
    const recipients = [
                { id: 'r1', name: 'Alice Johnson', email: 'alice@example.com', issued: 5, last_issued: '2025-11-19' },
                { id: 'r2', name: 'Bob Smith', email: 'bob@example.com', issued: 2, last_issued: '2025-11-15' },
                { id: 'r3', name: 'Charlie Day', email: 'charlie@example.com', issued: 1, last_issued: '2025-11-01' },
                ]


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="text-xl font-semibold text-gray-800">All Recipients</h3>
                <div className="flex space-x-3">
                    <input type="text" placeholder="Search by name or email" className="p-2 border rounded-lg w-64" />
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Filter</button>
                </div>
            </div>


            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credentials Issued</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Issue Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recipients.map((r) => (
                            <tr key={r.id} className="hover:bg-blue-chill-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.issued}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.last_issued}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-blue-chill-600 hover:text-blue-chill-900">View History</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default RecipientManagement;