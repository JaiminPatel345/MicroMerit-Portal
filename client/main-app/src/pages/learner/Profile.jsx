import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { learnerApi } from "../../services/authServices";
import { motion } from "framer-motion";
import { Pencil, Mail, MapPin, Copy, ShieldCheck, Check } from "lucide-react";

export default function PublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const learner = useSelector(state => state.authLearner.learner);
  const isAuthenticated = useSelector(state => state.authLearner.isAuthenticated);
  const [profile, setProfile] = useState(learner);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [filters, setFilters] = useState({ issuerId: '', certificateTitle: '' });
  const [availableIssuers, setAvailableIssuers] = useState([]);

  const isOwner = isAuthenticated && learner?.id?.toString() === slug?.toString();

  const fetchProfile = async () => {
    try {
      if (isOwner) {
        const [certsRes, dashboardRes] = await Promise.all([
          learnerApi.getCertificates({ limit: 10, status: 'issued', ...filters }),
          learnerApi.getDashboard()
        ]);
        setCertificates(certsRes.data.data.data || []);
        setStats(dashboardRes.data.data);
      } else {
        if (!slug || isNaN(parseInt(slug))) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const res = await learnerApi.getPublicProfile(slug, filters);
        const data = res.data.data;
        setProfile(data.learner);
        setCertificates(data.certificates || []);
        setStats(data.stats);
        setAvailableIssuers(data.filters?.issuers || []);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (!isOwner) setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [slug, isOwner, filters]);

  if (loading) return <p className="text-center py-10">Loading profile...</p>;
  if (!profile) return <p className="text-center py-10">Profile not found</p>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">

      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-80 rounded-xl flex-shrink-0">
        <div className="relative flex flex-col items-center text-center">
          <div className="w-48 h-48 rounded-full overflow-hidden shadow-lg">
            <img
              src={profile.profileUrl || `https://api.dicebear.com/7.x/thumbs/svg?seed=${profile.email}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold text-blue-chill-800 mt-4">
            {profile.name || "Unnamed User"}
          </h1>

          <p className="text-blue-chill-500 text-sm">
            {profile.email ? `@${profile.email.split("@")[0]}` : ""}
          </p>

          {isOwner && (
            <button
              onClick={() => navigate('/edit-profile')}
              className="border border-blue-chill-400 px-4 py-2 rounded-lg mt-3 text-blue-chill-600 hover:bg-blue-chill-100 flex items-center gap-2"
            >
              <Pencil size={16} /> Edit Profile
            </button>
          )}
        </div>

        <div className="mt-6 text-gray-600 space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-blue-chill-600" />
              INDIA
            </div>


            <div className="flex items-center gap-2">
              <Mail size={14} className="text-blue-chill-600" />
              {profile.email}
            </div>

            <button
              className="flex items-center gap-2 text-blue-chill-500 hover:underline text-sm transition-all"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Profile Link"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-blue-chill-700 mb-3 flex gap-2 items-center">
              <ShieldCheck size={16} /> Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-chill-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-blue-chill-700">{stats?.totalCredentials || stats?.totalCertificates || 0}</div>
                <div className="text-xs text-blue-chill-600">Certificates</div>
              </div>
              <div className="bg-blue-chill-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-blue-chill-700">{stats?.trustScore || 0}%</div>
                <div className="text-xs text-blue-chill-600">Trust Score</div>
              </div>
            </div>
          </div>

          {stats?.topSkills?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-blue-chill-700 mb-3">Top Skills</h3>
              <div className="flex flex-wrap gap-2">
                {stats.topSkills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    {skill.skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <h2 className="text-xl font-semibold text-blue-chill-800">Certificates</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by title..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-chill-500"
              value={filters.certificateTitle}
              onChange={(e) => setFilters(prev => ({ ...prev, certificateTitle: e.target.value }))}
            />

            {!isOwner && availableIssuers.length > 0 && (
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-chill-500 bg-white"
                value={filters.issuerId}
                onChange={(e) => setFilters(prev => ({ ...prev, issuerId: e.target.value }))}
              >
                <option value="">All Issuers</option>
                {availableIssuers.map(issuer => (
                  <option key={issuer.id} value={issuer.id}>{issuer.name}</option>
                ))}
              </select>
            )}

            {isOwner && <button className="text-sm text-blue-chill-600 hover:underline whitespace-nowrap">Manage Certificates →</button>}
          </div>
        </div>

        {certificates.length === 0 ? (
          <p className="text-gray-500">{isOwner ? "You haven't added any certificates yet." : "No certificates available."}</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {certificates.map((cert, i) => (
                <Link to={isOwner ? `/credential/${cert.id}` : `/c/${cert.credential_id}`} key={cert.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border rounded-xl p-5 shadow-sm hover:shadow-lg transition cursor-pointer bg-white h-full flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-chill-50 flex items-center justify-center text-blue-chill-600 font-bold text-lg">
                        {cert.issuer?.name?.[0] || "C"}
                      </div>
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                        Verified
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{cert.certificate_title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{cert.issuer?.name}</p>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                      <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                      <span>ID: {cert.credential_id?.substring(0, 6)}...</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {isOwner && (
              <div className="mt-8 text-center">
                <Link
                  to="/wallet"
                  className="inline-flex items-center justify-center px-6 py-2.5 border border-blue-chill-200 text-blue-chill-600 font-medium rounded-lg hover:bg-blue-chill-50 transition-colors"
                >
                  View All Certificates in Wallet
                </Link>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
