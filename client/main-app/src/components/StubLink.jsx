import React from 'react';
const Link = ({ to, className, children, onClick }) => {
return (
<button
className={className}
onClick={(e) => { if (onClick) onClick(e); console.log(`[STUB] Navigating to: ${to}`); }}
>
{children}
</button>
);
};
export default Link;