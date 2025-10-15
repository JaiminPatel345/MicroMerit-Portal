# MicroMerit Portal - SIH Micro-Credential Platform# React + TypeScript + Vite



A complete dummy frontend for a Micro-Credential Aggregator System built for Smart India Hackathon 2024.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 FeaturesCurrently, two official plugins are available:



### 🎓 Learner Side- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **Dashboard** with verified micro-credentials and NSQF mapping- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Upload Certificate** feature with verification simulation

- **AI Skill Recommendations** with personalized suggestions## React Compiler

- **Learning Pathways** showing skill progression timeline

- **Portfolio** showcasing projects and code samplesThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- **Share Profile** functionality

## Expanding the ESLint configuration

### 🏫 Issuer Side

- **Issuer Dashboard** for credential managementIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **Issue Credentials** to learners

- **Manage Learners** with table view and verification statuses```js

export default defineConfig([

### 🏢 Employer Side  globalIgnores(['dist']),

- **Employer Portal** to search learners by skill/NSQF level  {

- **View Learner Profiles** with detailed skill information    files: ['**/*.{ts,tsx}'],

- **Credential Verification** with blockchain simulation    extends: [

- **Analytics Dashboard** with charts showing skill demand trends      // Other configs...



### 🧠 AI & Security Features (Visual)      // Remove tseslint.configs.recommended and replace with this

- AI Skill Analysis with animated loaders      tseslint.configs.recommendedTypeChecked,

- DigiLocker Login button (demo)      // Alternatively, use this for stricter rules

- Blockchain Verification (simulated)      tseslint.configs.strictTypeChecked,

- NSQF Alignment indicators      // Optionally, add this for stylistic rules

      tseslint.configs.stylisticTypeChecked,

## 🛠️ Tech Stack

      // Other configs...

- **React 18** + **TypeScript**    ],

- **Redux Toolkit** for state management    languageOptions: {

- **React Router** for navigation      parserOptions: {

- **Tailwind CSS** for styling        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Framer Motion** for animations        tsconfigRootDir: import.meta.dirname,

- **Recharts** for data visualization      },

- **React Hot Toast** for notifications      // other options...

- **Lucide React** for icons    },

  },

## 📁 Project Structure])

```

```

src/You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

├── api/              # Dummy API layer with simulated delays

├── data/             # Static JSON files (learners, issuers, credentials, etc.)```js

├── features/         # Redux slices (auth, learners, recommendations, analytics)// eslint.config.js

├── components/       # Reusable UI components (Button, Card, Modal, Loaders)import reactX from 'eslint-plugin-react-x'

├── pages/            # Main pages (Login, Learner/Issuer/Employer Dashboards)import reactDom from 'eslint-plugin-react-dom'

├── hooks/            # Custom hooks (Redux hooks)

├── store/            # Redux store configurationexport default defineConfig([

├── types/            # TypeScript type definitions  globalIgnores(['dist']),

└── App.tsx           # Main app with routing  {

```    files: ['**/*.{ts,tsx}'],

    extends: [

## 🚀 Getting Started      // Other configs...

      // Enable lint rules for React

### Installation      reactX.configs['recommended-typescript'],

      // Enable lint rules for React DOM

```bash      reactDom.configs.recommended,

# Install dependencies    ],

yarn    languageOptions: {

      parserOptions: {

# Start development server        project: ['./tsconfig.node.json', './tsconfig.app.json'],

yarn dev        tsconfigRootDir: import.meta.dirname,

```      },

      // other options...

### Demo Credentials    },

  },

Login as any role with any email/password combination. The app uses dummy authentication.])

```

**Quick Demo:**
- Email: `demo@micromerit.in`
- Password: `demo123`
- Select any role: Learner, Issuer, or Employer

## 🎨 UI/UX Highlights

- **Glassmorphism** cards with backdrop blur
- **Gradient text** and button styling
- **Smooth animations** using Framer Motion
- **Loading states** with custom loaders and skeletons
- **Shimmer effects** for visual polish
- **Toast notifications** for user feedback
- **Responsive design** for all screen sizes

## 🔄 Data Flow

All data is stored in `src/data/` as JSON files:
- `learners.json` - Learner profiles with skills and credentials
- `issuers.json` - Training provider information
- `credentials.json` - Credential templates and metadata
- `recommendations.json` - AI-powered skill recommendations
- `analytics.json` - Platform analytics and trends

The `src/api/` layer simulates async API calls with delays, making it easy to replace with real backend endpoints later.

## 📝 Key Components

### Reusable Components
- `Button` - Customizable button with variants and loading states
- `Card` - Flexible card component with glassmorphism option
- `CredentialCard` - Specialized card for displaying credentials
- `Modal` - Animated modal with size options
- `Loader` - Multiple loader variants (spinner, skeleton, AI analyzing)

### Pages
- `LoginPage` - Role selection and authentication
- `LearnerDashboard` - Complete learner experience with all features
- `IssuerDashboard` - Credential issuance and learner management
- `EmployerDashboard` - Learner search and credential verification

## 🎯 SIH Presentation Features

All major features are **visually functional** for demo purposes:

✅ Upload certificates (with verification animation)  
✅ AI skill analysis (with analyzing animation)  
✅ Credential verification (with blockchain animation)  
✅ Share profile (copies link to clipboard)  
✅ Issue credentials (with success toast)  
✅ Search learners (with real-time filtering)  
✅ View analytics (with interactive charts)  

## 🔮 Future Backend Integration

When implementing the real backend, you only need to:

1. Update functions in `src/api/` to make real HTTP requests
2. Keep all Redux slices, components, and pages unchanged
3. Replace static JSON imports with API responses

Example:
```typescript
// Before (dummy)
export const fetchLearners = async () => {
  await delay(800);
  return learnersData as Learner[];
};

// After (real API)
export const fetchLearners = async () => {
  const response = await fetch('/api/learners');
  return response.json();
};
```

## 📊 Demo Data

The app includes realistic dummy data:
- 3 Learners with diverse skill sets
- 6 Issuers (training providers)
- 8 Credential templates
- AI recommendations for each learner
- Analytics data with trends and statistics

## 🎥 Recording Tips

For SIH presentation:
1. Start with **Login page** - show role selection
2. Demo **Learner Dashboard** - upload certificate, view AI recommendations
3. Show **Learning Pathways** with progress visualization
4. Switch to **Issuer Dashboard** - issue a credential
5. Switch to **Employer Portal** - search and verify credentials
6. Highlight **Analytics** with interactive charts
7. Show smooth **animations and transitions** throughout

## 🏆 Built for Smart India Hackathon 2024

This project demonstrates a complete micro-credential aggregation platform with:
- NSQF-aligned credentials
- Blockchain verification (simulated)
- AI-powered skill recommendations
- Comprehensive analytics
- Multi-role access (Learner, Issuer, Employer)

---

**Made with ❤️ for SIH 2024**
