import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Shield,
  Network,
  Briefcase,
  Upload,
  Brain,
  Lock,
  Database,
  Share2,
  Award,
  Users,
  Building2,
  ChevronRight,
  Zap,
  CheckCircle,
} from 'lucide-react';
// Assuming Link is correctly imported from react-router-dom in your environment
import { Link } from 'react-router-dom'; 

const Home = () => {
  // FIXED: Simplified the transition to use a standard "easeOut" for professionalism
  // and to resolve the WAAPI compatibility error.
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" } 
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <Wallet className="w-8 h-8 text-white" />,
      title: "All Certificates in One Wallet",
      description: "Automatically collect certificates from providers like Skill India Digital, DigiLocker, EdTech platforms, and Universities"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      title: "AI Skill Pathway",
      description: "Understand your current skill level, get AI-powered recommendations, and predict your NSQF level"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Secure Credential Verification",
      description: "Powered by blockchain hashing, QR verification, and provider API validation"
    },
    {
      icon: <Network className="w-8 h-8 text-white" />,
      title: "Multi-Provider Credential Sync",
      description: "Issue or import certificates from universities, training partners, skill councils, and EdTech platforms"
    },
    {
      icon: <Briefcase className="w-8 h-8 text-white" />,
      title: "Employer-Ready Profiles",
      description: "Generate verifiable portfolios for jobs and internships"
    },
    {
      icon: <Database className="w-8 h-8 text-white" />,
      title: "Decentralized Data Integrity",
      description: "Your data is stored securely and immutably, ensuring long-term authenticity and tamper-proof records."
    }
  ];

  const steps = [
    { icon: <Upload className="w-6 h-6" />, title: "Upload or Auto-Sync Certificates" },
    { icon: <Brain className="w-6 h-6" />, title: "AI extracts skills & levels" },
    { icon: <Lock className="w-6 h-6" />, title: "Blockchain secures authenticity" },
    { icon: <Database className="w-6 h-6" />, title: "Store in your MicroMerit Wallet" },
    { icon: <Share2 className="w-6 h-6" />, title: "Share with employers with one click" }
  ];

  const userTypes = [
    {
      title: "For Learners",
      icon: <Award className="w-16 h-16 text-white" />,
      benefits: [
        "Store all certificates",
        "AI skill discovery",
        "Shareable verified profile"
      ],
      color: "bg-blue-chill-600"
    },
    {
      title: "For Providers",
      icon: <Building2 className="w-16 h-16 text-white" />,
      benefits: [
        "Bulk issue secure credentials",
        "API-based seamless issuance",
        "Verification dashboard"
      ],
      color: "bg-teal-500" // Secondary color for contrast
    },
    {
      title: "For Employers",
      icon: <Users className="w-16 h-16 text-white" />,
      benefits: [
        "Verify credentials instantly",
        "Download verified portfolios",
        "Skill-based candidate search"
      ],
      color: "bg-indigo-600"
    }
  ];

  const integrations = [
    "DigiLocker",
    "Skill India Digital",
    "NSDC",
    "Universities",
    "EdTech Companies",
    "Sector Skill Councils"
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* ---------------------------------- Hero Section (Responsive) ---------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-chill-50 to-blue-chill-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <motion.div {...fadeInUp} className="order-2 lg:order-1">
              <span className="inline-flex items-center rounded-full bg-blue-chill-100 px-3 py-1 text-sm font-semibold text-blue-chill-700 mb-4 border border-blue-chill-300">
                <Zap className="w-4 h-4 mr-1 text-blue-chill-600" /> AI & Blockchain Powered
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Your Verifiable <br/> <span className="text-blue-chill-700">Credential Hub</span> for India
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                MicroMerit unifies all your certifications — from government skilling bodies, colleges, and ed-tech platforms — into a secure, AI-powered digital wallet verified by blockchain.
              </p>
              
              <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
                <Link to="/signup" className="bg-blue-chill-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-full hover:bg-blue-chill-700 transition font-bold text-base md:text-lg shadow-xl shadow-blue-chill-200 transform hover:-translate-y-1">
                  Create Wallet Now &rarr;
                </Link>
                <Link to="/demo" className="bg-white text-blue-chill-600 border-2 border-blue-chill-600 px-6 md:px-8 py-3 md:py-4 rounded-full hover:bg-blue-chill-50 transition font-semibold text-base md:text-lg">
                  Watch Live Demo
                </Link>
              </motion.div>

              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <Shield className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600 font-medium">100% Secure & NSQF Compliant Platform</p>
              </div>
            </motion.div>

            {/* Right Illustration/Wallet */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="relative w-full max-w-lg mx-auto order-1 lg:order-2 mb-8 lg:mb-0"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border-4 border-blue-chill-300 transform lg:rotate-3 transition-transform duration-500 ease-out">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center"><Wallet className="w-6 h-6 mr-2 text-blue-chill-600" /> MicroMerit Wallet</h3>
                  <span className="text-sm font-medium text-gray-500">3 Verified Records</span>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Skill India Digital Course", date: "Jan 2025" },
                    { title: "University Degree (B.Tech)", date: "May 2024" },
                    { title: "EdTech Platform Certificate", date: "Sep 2025" },
                  ].map((cert, i) => (
                    <div key={i} className="bg-gradient-to-r from-blue-chill-600 to-blue-chill-700 rounded-xl p-4 text-white shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{cert.title}</p>
                          <p className="text-xs opacity-90">{cert.date} | Verified</p>
                        </div>
                        <Award className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- Features Section (Responsive) ---------------------------------- */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Core Features of MicroMerit</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Harnessing AI and distributed ledger technology to create a trustworthy and comprehensive skill ecosystem.</p>
          </motion.div>

          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl border-t-4 border-blue-chill-600 transition transform hover:scale-[1.02]"
              >
                <div className="bg-blue-chill-600 p-3 rounded-xl inline-flex mb-4 shadow-md">
                    {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------- Process Steps (Responsive Flow) ---------------------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">The MicroMerit Flow: Simple and Secure</h2>
            <p className="text-lg text-gray-600">From certificate upload to verified sharing in five transparent steps.</p>
          </motion.div>

          {/* Flow Container */}
          <div className="flex flex-col md:flex-row items-center justify-between relative">
            {/* Horizontal Line Connector (Hidden on Mobile) */}
            <div className="hidden md:block absolute top-[calc(40px+0.5rem)] left-0 right-0 h-1 bg-blue-chill-200 z-0 mx-8"></div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="w-full md:w-1/5 text-center p-4 relative z-10 flex flex-col items-center"
              >
                {/* Vertical Line Connector (Only on Mobile) */}
                {index > 0 && (
                  <div className="block md:hidden absolute w-1 h-full bg-blue-chill-200 z-0 top-0 -translate-y-1/2"></div>
                )}
                
                <div className="bg-blue-chill-600 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-4 shadow-xl text-white border-4 border-white transition-all duration-300">
                  {step.icon}
                </div>
                <div className="bg-white text-blue-chill-600 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto mb-3 font-extrabold text-xs border-2 border-blue-chill-600">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold text-gray-800 px-2">{step.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- NSQF/AI Pathway (Responsive) ---------------------------------- */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-chill-700 to-blue-chill-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">NSQF Skill Mapping powered by AI</h2>
              <p className="text-lg md:text-xl mb-8 text-blue-chill-200">
                Instantly map your diverse skill portfolio to the **National Skills Qualifications Framework (NSQF)**. Get personalized, data-driven recommendations to achieve your next skill level.
              </p>
              <Link to="/pathway" className="inline-flex items-center bg-white text-blue-chill-600 px-6 py-3 rounded-full hover:bg-blue-chill-50 transition font-bold shadow-2xl">
                Start My Skill Pathway <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>

            {/* Right Visualization Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 md:p-8 text-gray-900 shadow-2xl mt-8 lg:mt-0"
            >
              <div className="mb-6 border-b pb-4 border-gray-100">
                <h4 className="text-xl md:text-2xl font-bold text-blue-chill-700">My NSQF Skill Profile</h4>
              </div>
              
              <div className="space-y-6">
                
                {/* Progress Bar */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base md:text-lg">NSQF Level 4 Achieved</span>
                    <span className="text-blue-chill-600 font-extrabold text-lg md:text-xl">85%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4">
                    <div className="bg-gradient-to-r from-blue-chill-500 to-blue-chill-600 h-4 rounded-full shadow-md" style={{ width: '85%' }}></div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="pt-2 space-y-3">
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p className="font-bold text-green-700">Next Target: NSQF Level 5</p>
                    <p className="text-sm text-gray-600">Recommended Course: Certified Data Analyst (Advanced)</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                    <p className="font-bold text-yellow-800">Key Skill Gaps</p>
                    <p className="text-sm text-gray-700">Advanced Project Management, Cloud Infrastructure.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- User Types (Responsive) ---------------------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Empowering the Entire Skill Ecosystem</h2>
            <p className="text-lg text-gray-600">MicroMerit provides tailored solutions for everyone involved in skilling.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {userTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.7 }}
                className={`rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-500`}
              >
                {/* Header */}
                <div className={`${type.color} text-white p-6 md:p-8 flex flex-col items-center justify-center`}>
                    {type.icon}
                    <h3 className="text-2xl md:text-3xl font-extrabold mt-4">{type.title}</h3>
                </div>

                {/* Benefits */}
                <div className="bg-white p-6 md:p-8">
                    <ul className="space-y-4">
                        {type.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start text-gray-700 border-b border-gray-100 pb-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1" />
                                <span className="font-medium">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                    <Link to={`/for-${type.title.toLowerCase().replace(' ', '-')}`} className={`mt-8 inline-block w-full text-center ${type.color} text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition text-base`}>
                        Learn More <ChevronRight className="w-4 h-4 inline-block ml-1" />
                    </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- Integrations (Responsive) ---------------------------------- */}
      <section className="py-16 md:py-20 bg-blue-chill-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Trusted Across India's Skilling Ecosystem</h2>
            <p className="text-lg text-gray-600">Seamlessly integrated with government portals, educational bodies, and industry leaders.</p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl px-6 py-4 shadow-lg border-2 border-gray-100 hover:border-blue-chill-400 transition transform hover:-translate-y-1"
              >
                <p className="text-lg font-bold text-gray-800 tracking-wider">{integration}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- Call to Action (Final) ---------------------------------- */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-blue-chill-600 to-blue-chill-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Build a Verifiable, Future-Ready Profile</h2>
            <p className="text-lg md:text-xl mb-10 text-blue-chill-100 max-w-2xl mx-auto">Take control of your credentials. Sign up today and experience the future of skill verification.</p>
            <Link to="/signup" className="inline-block bg-white text-blue-chill-600 px-8 md:px-12 py-4 md:py-5 rounded-full hover:bg-blue-chill-50 transition font-bold text-lg md:text-xl shadow-2xl shadow-blue-chill-900/50 transform hover:scale-105">
              Create Your Free Account
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;