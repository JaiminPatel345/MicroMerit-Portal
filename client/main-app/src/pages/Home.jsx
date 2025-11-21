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
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      icon: <Wallet className="w-12 h-12 text-blue-chill-600" />,
      title: "All Certificates in One Wallet",
      description: "Automatically collect certificates from providers like Skill India Digital, DigiLocker, EdTech platforms, and Universities"
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-blue-chill-600" />,
      title: "AI Skill Pathway",
      description: "Understand your current skill level, get AI-powered recommendations, and predict your NSQF level"
    },
    {
      icon: <Shield className="w-12 h-12 text-blue-chill-600" />,
      title: "Secure Credential Verification",
      description: "Powered by blockchain hashing, QR verification, and provider API validation"
    },
    {
      icon: <Network className="w-12 h-12 text-blue-chill-600" />,
      title: "Multi-Provider Credential Sync",
      description: "Issue or import certificates from universities, training partners, skill councils, and EdTech platforms"
    },
    {
      icon: <Briefcase className="w-12 h-12 text-blue-chill-600" />,
      title: "Employer-Ready Profiles",
      description: "Generate verifiable portfolios for jobs and internships"
    }
  ];

  const steps = [
    { icon: <Upload className="w-8 h-8" />, title: "Upload or Auto-Sync Certificates" },
    { icon: <Brain className="w-8 h-8" />, title: "AI extracts skills & levels" },
    { icon: <Lock className="w-8 h-8" />, title: "Blockchain secures authenticity" },
    { icon: <Database className="w-8 h-8" />, title: "Store in your MicroMerit Wallet" },
    { icon: <Share2 className="w-8 h-8" />, title: "Share with employers with one click" }
  ];

  const userTypes = [
    {
      title: "For Learners",
      icon: <Award className="w-16 h-16 text-blue-chill-600" />,
      benefits: [
        "Store all certificates",
        "AI skill discovery",
        "Shareable profile"
      ]
    },
    {
      title: "For Providers",
      icon: <Building2 className="w-16 h-16 text-blue-chill-600" />,
      benefits: [
        "Bulk issue credentials",
        "API-based issuance",
        "Verification dashboard"
      ]
    },
    {
      title: "For Employers",
      icon: <Users className="w-16 h-16 text-blue-chill-600" />,
      benefits: [
        "Verify instantly",
        "Download verified portfolios",
        "Skill-based candidate search"
      ]
    }
  ];

  const integrations = [
    "DigiLocker",
    "Skill India Digital",
    "NSDC",
    "Universities",
    "EdTech Companies"
  ];

//   const testimonials = [
//     {
//       name: "Priya Sharma",
//       role: "Learner",
//       content: "MicroMerit helped me organize all my certificates from different courses. The AI recommendations showed me exactly what skills I needed for my dream job.",
//       avatar: "PS"
//     },
//     {
//       name: "Dr. Rajesh Kumar",
//       role: "University Administrator",
//       content: "As a university, issuing and verifying credentials was always a challenge. MicroMerit's provider portal made it seamless and secure.",
//       avatar: "RK"
//     },
//     {
//       name: "Anita Desai",
//       role: "HR Manager",
//       content: "Hiring became so much easier with MicroMerit. We can instantly verify candidate credentials and see their complete skill portfolio.",
//       avatar: "AD"
//     }
//   ];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-chill-50 via-white to-blue-chill-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <h1 className="text-5xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Unify All Your <br/> <span className="text-blue-chill-600 ">Micro-Credentials</span> <br/> in One Place
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                MicroMerit brings together all your certificates — from colleges, ed-tech platforms, and skilling bodies — into a single verified digital wallet powered by AI and blockchain.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup" className="bg-blue-chill-600 text-white px-8 py-4 rounded-lg hover:bg-blue-chill-700 transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Get Started ↗
                </Link>
                <Link to="/demo" className="bg-white text-blue-chill-600 border-2 border-blue-chill-600 px-8 py-4 rounded-lg hover:bg-blue-chill-50 transition font-semibold text-lg">
                  View Demo
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-blue-chill-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">My Wallet</h3>
                  <Wallet className="w-8 h-8 text-blue-chill-600" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gradient-to-r from-blue-chill-500 to-blue-chill-600 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Certificate {i}</p>
                          <p className="text-sm opacity-90">Verified Credential</p>
                        </div>
                        <Award className="w-6 h-6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-chill-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-chill-300 rounded-full opacity-20 animate-pulse"></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What MicroMerit Offers</h2>
            <p className="text-xl text-gray-600">Comprehensive credential management for the modern learner</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-blue-chill-300 hover:shadow-xl transition transform hover:-translate-y-2"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-chill-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">A Simple, Transparent Credential Journey</h2>
            <p className="text-xl text-gray-600">From upload to verification in five easy steps</p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg text-blue-chill-600">
                  {step.icon}
                </div>
                <div className="bg-blue-chill-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 font-bold">
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-gray-700">{step.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-chill-600 to-blue-chill-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">Grow Your Career With AI-Powered NSQF Mapping</h2>
              <p className="text-xl mb-8 text-blue-chill-100">
                MicroMerit helps you understand your progression across NSQF levels with personalized learning pathways tailored to your goals.
              </p>
              <Link to="/pathway" className="inline-flex items-center bg-white text-blue-chill-600 px-6 py-3 rounded-lg hover:bg-blue-chill-50 transition font-semibold">
                Explore Your Pathway <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 text-gray-900"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Current Level: NSQF 4</span>
                  <span className="text-blue-chill-600 font-bold">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-chill-500 to-blue-chill-600 h-3 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="bg-blue-chill-50 rounded-lg p-4">
                    <p className="font-semibold text-blue-chill-700">Next Recommended Course</p>
                    <p className="text-sm text-gray-600">Advanced Web Development</p>
                  </div>
                  <div className="bg-blue-chill-50 rounded-lg p-4">
                    <p className="font-semibold text-blue-chill-700">Skills to Develop</p>
                    <p className="text-sm text-gray-600">React.js, Node.js, Database Design</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-blue-chill-50 to-white border-2 border-blue-chill-200 rounded-2xl p-8 text-center hover:shadow-2xl transition transform hover:-translate-y-2"
              >
                <div className="flex justify-center mb-6">{type.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{type.title}</h3>
                <ul className="space-y-3">
                  {type.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <ChevronRight className="w-5 h-5 text-blue-chill-600 mr-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Works With Your Existing Platforms</h2>
            <p className="text-xl text-gray-600">Seamlessly integrated with leading credential providers</p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-12">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg px-8 py-6 shadow-md hover:shadow-xl transition"
              >
                <p className="text-xl font-semibold text-gray-800">{integration}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* testinomials */}

      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-blue-chill-50 rounded-xl p-8 hover:shadow-xl transition"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-chill-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-blue-chill-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{testimonial.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="py-20 bg-gradient-to-r from-blue-chill-600 to-blue-chill-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">Start Your Skill Journey Today</h2>
            <p className="text-xl mb-8 text-blue-chill-100">Join thousands of learners, institutions, and employers on MicroMerit</p>
            <Link to="/signup" className="inline-block bg-white text-blue-chill-600 px-10 py-4 rounded-lg hover:bg-blue-chill-50 transition font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1">
              Create Your Free Account
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
