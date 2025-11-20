import api from './axiosInstance';


export const sendOTP = async (mobile) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`OTP sent to ${mobile}`);
      resolve({ success: true, message: 'OTP sent successfully' });
    }, 1000);
  });
};

export const oauthGoogleLogin = {
  oauth: () => api.get('/auth/learner/oauth/google'),
};

export const signUpLeaner = {
   start : (payload) => api.post('auth/learner/start-register',payload),
   verify : (payload) => api.post('auth/learner/verify-otp',payload)
}




export const verifyOTP = async (mobile, otp) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Verifying OTP ${otp} for ${mobile}`);
      resolve({ success: true, message: 'OTP verified successfully' });
    }, 1000);
  });
};

export const loginWithEmailPassword = async (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Login attempt: ${email}`);
      resolve({ success: true, user: { email } });
    }, 1000);
  });
};

export const loginWithMobileOTP = async (mobile, otp) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Mobile login: ${mobile} with OTP ${otp}`);
      resolve({ success: true, user: { mobile } });
    }, 1000);
  });
};

export const signupWithEmail = async (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Signup with email: ${email}`);
      resolve({ success: true, user: { email } });
    }, 1000);
  });
};

export const signupWithMobile = async (mobile) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Signup with mobile: ${mobile}`);
      resolve({ success: true, user: { mobile } });
    }, 1000);
  });
};

export const loginWithGoogle = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Google login initiated');
      resolve({ success: true, user: { email: 'user@gmail.com', provider: 'google' } });
    }, 1000);
  });
};

export const loginWithDigiLocker = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('DigiLocker login initiated');
      resolve({ success: true, user: { email: 'user@digilocker.in', provider: 'digilocker' } });
    }, 1000);
  });
};

export const createUserProfile = async (profileData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Creating user profile:', profileData);
      resolve({ success: true, profile: profileData });
    }, 1000);
  });
};
