import React from 'react';
const Card = ({ title, value, icon: Icon, colorClass }) => (
<div className={`p-5 rounded-xl shadow-md ${colorClass} transition duration-300 transform hover:scale-[1.01]`}>
<div className="flex justify-between items-center">
<p className="text-sm font-medium opacity-80">{title}</p>
<Icon className="w-6 h-6 opacity-80" />
</div>
<p className="text-3xl font-bold mt-2">{value}</p>
</div>
);
export default Card;