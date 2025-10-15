import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const issuerFallback = new URL('../assets/issuer-fallback.svg', import.meta.url).href;

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glassmorphism?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className = '', hover = false, glassmorphism = false, onClick }: CardProps) => {
  const baseStyles = 'rounded-xl p-6 shadow-lg';
  const glassStyles = glassmorphism ? 'glassmorphism' : 'bg-white';
  const hoverStyles = hover ? 'card-hover cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface CredentialCardProps {
  credential: {
    id: string;
    title: string;
    issuer: string;
    issuerLogo: string;
    issueDate: string;
    nsqfLevel: number;
    status: string;
    skills: string[];
  };
  onClick?: () => void;
}

export const CredentialCard = ({ credential, onClick }: CredentialCardProps) => {
  const statusColors = {
    verified: 'bg-green-100 text-green-800 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Card hover onClick={onClick} className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={credential.issuerLogo || issuerFallback}
              onError={(event) => {
                const target = event.currentTarget;
                if (target.src !== issuerFallback) {
                  target.src = issuerFallback;
                }
              }}
              alt={credential.issuer}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <h3 className="font-bold text-lg text-gray-900">{credential.title}</h3>
              <p className="text-sm text-gray-600">{credential.issuer}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              statusColors[credential.status as keyof typeof statusColors]
            }`}
          >
            {credential.status}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            NSQF Level {credential.nsqfLevel}
          </span>
          <span className="text-sm text-gray-500">
            Issued: {new Date(credential.issueDate).toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {credential.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
              {skill}
            </span>
          ))}
          {credential.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{credential.skills.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
