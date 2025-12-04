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
  Star,
} from 'lucide-react';
// Assuming Link is correctly imported from react-router-dom in your environment
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { credentialServices } from '../services/credentialServices';
import CountUp from '../components/CountUp';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated: isIssuerAuth } = useSelector((state) => state.authIssuer);
  const { isAuthenticated: isLearnerAuth } = useSelector((state) => state.authLearner);

  const [latestCredentials, setLatestCredentials] = useState([]);
  const [totalCredentials, setTotalCredentials] = useState(0);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [topIssuers, setTopIssuers] = useState([]);
  const [isLoadingIssuers, setIsLoadingIssuers] = useState(true);

  const fetchTopIssuers = async () => {
    try {
      const response = await credentialServices.getTopIssuers(5);
      if (response.success && response.data) {
        setTopIssuers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch top issuers:', error);
    } finally {
      setIsLoadingIssuers(false);
    }
  };

  const fetchLatestCredentials = async () => {
    try {
      const response = await credentialServices.getLatestCredentials();
      if (response.success && response.data) {
        setLatestCredentials(response.data.credentials || []);
        setTotalCredentials(response.data.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch latest credentials:', error);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  useEffect(() => {
    if (isIssuerAuth) {
      navigate('/issuer/dashboard');
    } else if (isLearnerAuth) {
      navigate('/dashboard');
    }
  }, [isIssuerAuth, isLearnerAuth, navigate]);

  useEffect(() => {
    fetchLatestCredentials();
    fetchTopIssuers();
  }, []);
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
      icon: <Wallet className="w-6 h-6 text-blue-chill-200" />,
      title: "Unified Wallet",
      description: "Collect certificates from Skill India, DigiLocker, and Universities in one secure place."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-chill-600" />,
      title: "AI Pathways",
      description: "Get AI-powered skill recommendations and predict your NSQF level instantly."
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-chill-600" />,
      title: "Blockchain Verified",
      description: "Tamper-proof credentials secured by blockchain hashing and cryptographic signatures."
    },
    {
      icon: <Network className="w-6 h-6 text-blue-chill-200" />,
      title: "Multi-Provider Sync",
      description: "Seamlessly import certificates from training partners, skill councils, and ed-tech."
    },
    {
      icon: <Briefcase className="w-6 h-6 text-blue-chill-600" />,
      title: "Job-Ready Profiles",
      description: "Generate verifiable portfolios that employers can trust and verify instantly."
    },
    {
      icon: <Database className="w-6 h-6 text-blue-chill-600" />,
      title: "Data Integrity",
      description: "Your data is stored securely and immutably, ensuring long-term authenticity."
    }
  ];

  const steps = [
    { icon: <Upload className="w-6 h-6" />, title: "Issuer upload or Auto-Sync Certificates" },
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

  // Placeholder logos for infinite scroll
  const partnerLogos = [
    "https://ncvet.gov.in/wp-content/uploads/2023/09/ncvet-logo-full.jpg", // NCVET
    "https://www.skillindiadigital.gov.in/assets/new-ux-img/skill-india-big-logo.svg", // Skill India Digital
    "https://img1.digitallocker.gov.in/digilocker-landing-page/assets/img/DigilockerLogo.svg", // DigiLocker
    "https://nsdcindia.org/sites/default/files/logo.jpg" //NOS
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ---------------------------------- Hero Section (Responsive) ---------------------------------- */}
      <section className="min-h-[calc(100vh-4rem)] flex relative overflow-hidden bg-gradient-to-br from-white via-blue-chill-50 to-blue-chill-100 py-8 md:py-16">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-chill-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mt-8 md:mt-12">

            {/* Left Content */}
            <motion.div {...fadeInUp} className="order-2 lg:order-1">
              <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-blue-chill-700 mb-6 border border-blue-chill-200 shadow-sm">
                <Zap className="w-4 h-4 mr-2 text-blue-chill-600 fill-current" /> Blockchain, IPFS & AI Powered
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                Your Skills, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-chill-600 to-teal-500">Unified & Verified.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                MicroMerit is India's first decentralized credential wallet. Collect, verify, and showcase your achievements from universities, government bodies, and ed-tech platforms in one secure place.
              </p>

              <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
                <Link to="/signup" className="bg-blue-chill-600 text-white px-6 py-3 rounded-full hover:bg-blue-chill-700 transition font-bold text-base shadow-lg shadow-blue-chill-200 hover:shadow-xl text-center">
                  Create Free Wallet
                </Link>
                <Link to="/login" className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-full hover:border-blue-chill-600 hover:text-blue-chill-600 transition font-semibold text-base text-center hover:bg-blue-chill-50 shadow-sm hover:shadow-md">
                  Log In
                </Link>
              </motion.div>

              <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
                <span>Are you an institution?</span>
                <Link to="/issuer/login" className="text-blue-chill-600 hover:underline flex items-center font-semibold">
                  Issue Credentials <ChevronRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            </motion.div>

            {/* Right Illustration/Wallet */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="relative w-full max-w-lg mx-auto order-1 lg:order-2 mb-8 lg:mb-0"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-200 ring-1 ring-gray-100 transition-transform duration-500 ease-out">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center"><Wallet className="w-5 h-5 mr-2 text-blue-chill-600" />Latest Credentials</h3>
                </div>
                <div className="space-y-3">
                  {isLoadingCredentials ? (
                    // Loading skeleton
                    [1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-100 animate-pulse rounded-xl p-3 h-16"></div>
                    ))
                  ) : latestCredentials.length > 0 ? (
                    latestCredentials.map((cert, i) => {
                      const issueDate = new Date(cert.issued_at);

                      // Format time as HH:MM
                      const hours = issueDate.getHours().toString().padStart(2, '0');
                      const minutes = issueDate.getMinutes().toString().padStart(2, '0');
                      const timeString = `${hours}:${minutes}`;

                      // Format date
                      const dateString = issueDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });

                      const issuerName = cert.issuer?.name || 'Verified Issuer';

                      return (
                        <div key={i} className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-chill-300 transition-all duration-300 shadow-sm hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 pr-3">
                              <p className="font-bold text-gray-800 text-base truncate group-hover:text-blue-chill-700 transition-colors">{cert.certificate_title}</p>
                              <div className="flex items-center mt-1.5 space-x-2">
                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md font-medium">{timeString} • {dateString}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 font-medium">Issuer: {issuerName}</p>
                            </div>
                            <div className="bg-blue-chill-50 p-2.5 rounded-full group-hover:bg-blue-chill-100 transition-colors">
                              <Award className="w-5 h-5 text-blue-chill-600" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // No credentials state
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No credentials issued yet</p>
                      <p className="text-xs text-gray-400 mt-1">Be the first to join!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.8 },
                  scale: { duration: 0.5, delay: 0.8 },
                  y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }}
                className="absolute -top-12 -left-8 bg-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 z-20 flex items-center gap-3"
              >
                <div className="bg-yellow-50 p-2.5 rounded-full">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold text-gray-900 leading-none flex items-center">
                    <CountUp
                      from={0}
                      //TODO: Show real count after data seed
                      to={123}
                      // to={totalCredentials > 0 ? totalCredentials : 123}
                      separator=","
                      direction="up"
                      duration={1.5}
                      className="count-up-text"
                    />
                    +
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Credentials Issued & Verified
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- Core Features (Bento Grid) ---------------------------------- */}
      <section className="min-h-screen flex items-center py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Core Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to build a trusted, verifiable, and future-ready skill profile.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`
                  group relative overflow-hidden rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500
                  ${index === 0 || index === 3 ? 'md:col-span-2 bg-gradient-to-br from-blue-chill-50 to-white' : 'bg-white'}
                  ${index === 1 || index === 4 ? 'bg-gradient-to-br from-gray-50 to-white' : ''}
                  `}
              >
                <div className="relative z-10">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110
                    ${index === 0 || index === 3 ? 'bg-blue-chill-600 text-white' : 'bg-white text-blue-chill-600 border border-gray-100'}
                    `}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-chill-700 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-chill-100 to-transparent rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------- Process Steps (Premium Flow) ---------------------------------- */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-chill-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-30">
          <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-blue-chill-200 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
          <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-teal-200 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-blue-chill-600 font-bold tracking-wider uppercase text-sm mb-2 block">Seamless Experience</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">How MicroMerit Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From certificate upload to verified sharing, experience a secure and transparent journey in five simple steps.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-chill-200 via-blue-chill-400 to-blue-chill-200 -translate-y-1/2 z-0 rounded-full opacity-50"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-chill-300">
                    {/* Step Number Badge */}
                    <div className="absolute top-0 right-0 bg-blue-chill-50 text-blue-chill-600 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-blue-chill-100">
                      Step {index + 1}
                    </div>

                    {/* Icon Circle */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-chill-500 to-blue-chill-700 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 text-white ring-4 ring-blue-chill-50">
                      {step.icon}
                    </div>

                    <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-chill-700 transition-colors">{step.title}</h4>

                    {/* Decorative bottom gradient */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-chill-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </motion.div>
              ))}
            </div>
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


      {/* ---------------------------------- Join as Issuer CTA (White Theme) ---------------------------------- */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Right Content - Feature Cards */}
            <div className="grid gap-5">
              {/* Feature Card 1: Manual Issuance */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start">
                  <div className="bg-blue-chill-50 p-3 rounded-xl mr-5 group-hover:bg-blue-chill-100 transition-colors">
                    <Upload className="w-6 h-6 text-blue-chill-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Bulk Upload & Issue</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Upload CSV/Excel files to issue thousands of certificates in minutes. Perfect for universities, training centers, and event organizers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 2: API Integration */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start">
                  <div className="bg-blue-chill-50 p-3 rounded-xl mr-5 group-hover:bg-blue-chill-100 transition-colors">
                    <Network className="w-6 h-6 text-blue-chill-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Developer API</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Integrate our REST API directly into your LMS or ERP. Automate issuance upon course completion with seamless backend syncing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Left Content */}
            <div>
              <span className="inline-block py-1 px-3 rounded-full bg-blue-chill-50 text-blue-chill-600 text-xs font-bold tracking-wider uppercase mb-4 border border-blue-chill-100">
                For Organizations & Institutions
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                Empower Your Learners with <span className="text-blue-chill-600">Verifiable Credentials</span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-6 max-w-xl leading-relaxed">
                Join the MicroMerit ecosystem to issue tamper-proof e-certificates instantly. Streamline your certification process with our secure platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/issuer/signup" className="flex items-center justify-center px-6 py-3 bg-blue-chill-600 text-white rounded-xl font-bold text-base hover:bg-blue-chill-700 transition shadow-lg hover:shadow-blue-chill-200 transform hover:-translate-y-1">
                  Join as Issuer <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/issuer/login" className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-base hover:border-blue-chill-600 hover:text-blue-chill-600 transition">
                  Sign In
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------------------------- Trusted Ecosystem (Infinite Scroll) ---------------------------------- */}
      <section className="py-8 bg-white border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trusted Across India's Skilling Ecosystem</p>
        </div>

        <div className="relative flex overflow-x-hidden group">
          <div className="animate-marquee whitespace-nowrap flex items-center space-x-16 px-8">
            {partnerLogos.map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt="Partner Logo"
                className="h-12 md:h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                onError={(e) => { e.target.style.display = 'none' }} // Hide broken images
              />
            ))}
          </div>
          <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center space-x-16 px-8">
            {partnerLogos.map((logo, index) => (
              <img
                key={`dup-${index}`}
                src={logo}
                alt="Partner Logo"
                className="h-12 md:h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ))}
          </div>
        </div>
      </section>
      {/* ---------------------------------- Top Issuers Section (Logo Wall Premium Redesign) ---------------------------------- */}
      <section className="py-20 relative overflow-hidden bg-gray-50"> {/* Added a light background for contrast */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Global Leaders in Credentialing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the leading organizations empowering learners and professionals with verifiable credentials.
            </p>
          </div>

          {isLoadingIssuers ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 h-24 rounded-lg bg-white shadow-sm animate-pulse"></div>
              ))}
            </div>
          ) : topIssuers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-4 md:gap-x-8">
              {topIssuers.map((issuer, index) => {
                // Determine rank styling
                let rankBg = "bg-gray-200 text-gray-600";
                let rankBorder = "border-gray-200";
                let scale = "scale-100";

                if (index === 0) {
                  rankBg = "bg-yellow-500 text-white";
                  rankBorder = "border-yellow-400";
                  scale = "lg:scale-110"; // Make the top one slightly larger on large screens
                } else if (index === 1) {
                  rankBg = "bg-gray-400 text-white";
                  rankBorder = "border-gray-300";
                } else if (index === 2) {
                  rankBg = "bg-orange-400 text-white";
                  rankBorder = "border-orange-300";
                }

                return (
                  <motion.div
                    key={issuer.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className={`relative flex flex-col items-center text-center p-3 transition-all duration-500 hover:z-20 ${scale} hover:shadow-xl hover:bg-white rounded-xl`}
                  >
                    {/* Rank Badge - More prominent */}
                    <div className={`absolute -top-4 ${index < 3 ? 'w-8 h-8' : 'w-6 h-6'} rounded-full flex items-center justify-center text-xs font-black shadow-md ${rankBg}`}>
                      {index + 1}
                    </div>

                    {/* Logo Container */}
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-2 flex items-center justify-center overflow-hidden border-4 ${rankBorder} transition-all duration-300 shadow-lg mt-4`}>
                      {issuer.logo_url ? (
                        <img
                          src={issuer.logo_url}
                          alt={`${issuer.name} logo`}
                          className="w-full h-full object-contain rounded-full"
                          style={{ filter: index >= 3 ? 'grayscale(100%) opacity(70%)' : 'none' }} // Subtle effect for lower ranks
                        />
                      ) : (
                        <Building2 className={`w-8 h-8 ${index === 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
                      )}
                    </div>

                    {/* Issuer Details on Hover (Collapsed on default) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                      <h3 className="font-extrabold text-gray-900 text-base mb-1 text-center line-clamp-2">{issuer.name}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">{issuer.type}</p>

                      <div className="flex items-center justify-center text-blue-chill-600 font-bold text-sm bg-blue-chill-50 px-3 py-1 rounded-full">
                        <Award className="w-4 h-4 mr-1" />
                        {issuer.credentials_issued.toLocaleString()} Credentials
                      </div>
                    </div>

                    {/* Default Label (Visible when not hovering) */}
                    <h3 className="font-semibold text-gray-800 text-sm mt-3 line-clamp-1 w-full">{issuer.name}</h3>

                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-200 p-4 rounded-full mb-3">
                <Building2 className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Issuers Found</h3>
              <p className="text-gray-500 mt-1">Be the first to join the network.</p>
              <Link to="/issuer/signup" className="mt-4 text-sm text-blue-chill-600 font-semibold hover:text-blue-chill-700 flex items-center">
                Become an Issuer <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------- Verify Credential CTA ---------------------------------- */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-blue-chill-600 to-blue-chill-800 text-white relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-teal-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              <CheckCircle className="w-6 h-6 text-teal-300 mr-2" />
              <span className="font-semibold text-blue-chill-50">Instant Verification</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Verify Any Credential in Seconds
            </h2>
            <p className="text-lg md:text-xl mb-10 text-blue-chill-100 max-w-2xl mx-auto leading-relaxed">
              Ensure the authenticity of skills and achievements. Our blockchain-backed verification guarantees trust and transparency for employers and institutions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/verify" className="inline-flex items-center justify-center bg-white text-blue-chill-700 px-8 md:px-10 py-4 rounded-xl hover:bg-blue-chill-50 transition font-bold text-lg shadow-xl shadow-blue-chill-900/20 transform hover:-translate-y-1 w-full sm:w-auto">
                Verify Now <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center bg-transparent border-2 border-white/30 text-white px-8 md:px-10 py-4 rounded-xl hover:bg-white/10 transition font-bold text-lg w-full sm:w-auto">
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------- Footer ---------------------------------- */}
      <Footer />
    </div>
  );
};

export default Home;