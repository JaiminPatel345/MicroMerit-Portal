const Checkbox = ({ label, name, checked, onChange, error, required = false }) => {
  return (
    <div className="mb-4">
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(name, e.target.checked)}
          className="mt-1 w-5 h-5 text-blue-chill-600 border-gray-300 rounded focus:ring-blue-chill-500 focus:ring-2"
        />
        <span className="text-sm text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-500 ml-8">{error}</p>
      )}
    </div>
  );
};

export default Checkbox;
