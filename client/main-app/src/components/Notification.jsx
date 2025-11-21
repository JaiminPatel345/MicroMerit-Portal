import { useEffect, useState, useCallback } from "react";
import { registerNotificationHandler } from "../utils/notification"; // Assuming this utility is correct

const IconSuccess = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const IconError = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>;
const IconWarning = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14c-.9-1.5-3.1-1.5-4 0l-8 14c-.9 1.5.2 3.5 2 3.5h16c1.8 0 2.9-2 2-3.5z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;


const TYPE_STYLES = {
  success: {
    icon: IconSuccess,
    bg: "bg-green-50", // Light background
    border: "border-green-500", // Strong border
    text: "text-green-700", // Darker text
    fill: "text-green-500" // Icon color
  },
  error: {
    icon: IconError,
    bg: "bg-red-50",
    border: "border-red-500",
    text: "text-red-700",
    fill: "text-red-500"
  },
  warning: {
    icon: IconWarning,
    bg: "bg-yellow-50",
    border: "border-yellow-500",
    text: "text-yellow-800",
    fill: "text-yellow-600"
  },
  info: { // A professional, authoritative blue is great for official info
    icon: IconInfo,
    bg: "bg-blue-50", 
    border: "border-blue-700",
    text: "text-blue-800",
    fill: "text-blue-700"
  }
};

const Notification = () => {
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    registerNotificationHandler((message, type) => {
      setToast({ message, type });

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismissToast();
      }, 5000);
      
      // Cleanup function to clear the timeout
      return () => clearTimeout(timer);
    });
  }, [dismissToast]);

  if (!toast) return null;

  const styles = TYPE_STYLES[toast.type] || TYPE_STYLES.info; // Default to info if type is invalid
  const Icon = styles.icon;

  return (
    <div
      role="alert" // Essential for accessibility
      className={`fixed top-5 right-5 w-auto max-w-sm p-4 border-l-4 rounded-lg shadow-xl z-[9999] transition-opacity duration-300 ease-out 
        ${styles.bg} 
        ${styles.border}`}
    >
      <div className="flex items-start">
        {/* Icon Section */}
        <div className={`flex-shrink-0 ${styles.fill}`}>
          <Icon />
        </div>
        
        {/* Message Content */}
        <div className={`ml-3 text-sm font-medium ${styles.text} break-words`}>
          {toast.message}
        </div>

        {/* Dismiss Button */}
        <div className="ml-auto pl-3">
          <button
            onClick={dismissToast}
            className={`-m-1.5 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-opacity-80 transition ${styles.text}`}
          >
            <span className="sr-only">Dismiss</span>
            <IconClose />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;