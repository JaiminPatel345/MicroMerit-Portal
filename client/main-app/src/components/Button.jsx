const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  icon: Icon,
  fullWidth = false,
  className = ''
}) => {
  const baseStyles = 'px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-chill-600 text-white hover:bg-blue-chill-700 focus:ring-4 focus:ring-blue-chill-200',
    secondary: 'bg-white text-blue-chill-600 border-2 border-blue-chill-600 hover:bg-blue-chill-50 focus:ring-4 focus:ring-blue-chill-200',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-200'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
