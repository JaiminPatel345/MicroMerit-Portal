// EMAIL
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return '';
};

// MOBILE NUMBER
export const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobile) return 'Mobile number is required';
  if (!mobileRegex.test(mobile)) return 'Invalid mobile number (should be 10 digits starting with 6-9)';
  return '';
};

// PASSWORD
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return '';
};

// OTP
export const validateOTP = (otp) => {
  if (!otp) return 'OTP is required';
  if (!/^\d{6}$/.test(otp)) return 'OTP must be 6 digits';
  return '';
};

// NAME
export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name should only contain letters';
  return '';
};

// DATE OF BIRTH
export const validateDOB = (dob) => {
  if (!dob) return 'Date of Birth is required';
  const date = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  if (age < 13) return 'You must be at least 13 years old';
  if (age > 100) return 'Invalid date of birth';
  return '';
};

// ROLE
export const validateRole = (role) => {
  if (!role) return 'Please select a role';
  return '';
};

// CONSENT CHECKBOX
export const validateConsent = (consent) => {
  if (!consent) return 'You must agree before continuing';
  return '';
};

// ADDRESS
export const validateAddress = (address) => {
  if (!address) return 'Address is required';
  if (address.length < 5) return 'Address must be at least 5 characters';
  return '';
};

// PINCODE (India)
export const validatePincode = (pincode) => {
  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!pincode) return 'Pincode is required';
  if (!pinRegex.test(pincode)) return 'Invalid Pincode';
  return '';
};

// GENDER
export const validateGender = (gender) => {
  if (!gender) return 'Please select gender';
  return '';
};

// STATE
export const validateState = (state) => {
  if (!state) return 'State is required';
  return '';
};

// CITY
export const validateCity = (city) => {
  if (!city) return 'City is required';
  return '';
};


// WEBSITE URL
export const validateURL = (url) => {
  if (!url) return 'URL is required';

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must start with http or https';
    }
    return '';
  } catch (error) {
    return 'Invalid URL format';
  }
};

// DOMAIN NAME (example.com, mysite.in, etc.)
export const validateDomain = (domain) => {
  if (!domain) return 'Domain name is required';

  // Domain: letters, numbers, hyphens, must include a dot + TLD
  const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,}$/;

  if (!domainRegex.test(domain)) {
    return 'Invalid domain name (example: yoursite.com)';
  }

  return '';
};

