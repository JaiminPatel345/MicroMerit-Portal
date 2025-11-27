import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { learnerApi } from "../../services/authServices";
import { motion } from "framer-motion";
import { Pencil, Mail, MapPin, Copy, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { learnerUpateProfile } from "../../store/authLearnerSlice";
import { setNotification } from "../../utils/notification";

export default function PublicProfile() {
  const { slug } = useParams();
  const learner = useSelector(state => state.authLearner.learner);
  const isAuthenticated = useSelector(state => state.authLearner.isAuthenticated);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(learner);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(profile?.profileUrl || '');
  const [errors, setErrors] = useState({});

  const isOwner = isAuthenticated && learner?.id?.toString() === slug?.toString();

  const fetchProfile = async () => {
    try {
      if (isOwner) {
        // const certs = await learnerApi.getCertificates();
        // setCertificates(certs.data.data || []);
      } else {
        // once public API exists, replace with: learnerApi.getPublicProfile(slug)
        const res = await learnerApi.getProfile();
        setProfile(res.data.data);
        setCertificates([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [slug, isOwner]);

  // Sync preview when profile updates
  useEffect(() => {
    setPreviewImage(profile?.profileUrl || "");
  }, [profile]);

  if (loading) return <p className="text-center py-10">Loading profile...</p>;
  if (!profile) return <p className="text-center py-10">Profile not found</p>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">

      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-80 rounded-xl">
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

          <p className="text-blue-chill-500 text-sm">@{profile.email.split("@")[0]}</p>

          {isOwner && (
            <button
              onClick={() => setShowEditModal(true)}
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
              className="flex items-center gap-2 text-blue-chill-500 hover:underline text-sm"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <Copy size={14} /> Copy Profile Link
            </button>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-blue-chill-700 mb-2 flex gap-2">
              <ShieldCheck size={16} /> Achievements
            </h3>
            <p className="text-gray-400 text-sm">Coming soon...</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-blue-chill-800">Certificates</h2>
          {isOwner && <button className="text-sm text-blue-chill-600 hover:underline">Manage Certificates →</button>}
        </div>

        {certificates.length === 0 ? (
          <p className="text-gray-500">{isOwner ? "You haven't added any certificates yet." : "No certificates available."}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, i) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border rounded-xl p-4 shadow-sm hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="font-semibold text-blue-chill-700">{cert.title}</h3>
                <p className="text-sm text-gray-500">{cert.issuer}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[450px] rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-blue-chill-700 mb-4">Edit Profile</h2>

            {errors.submit && <p className="text-sm text-red-500 mb-2">{errors.submit}</p>}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrors({});

                const form = e.target;
                const formData = new FormData();

                const fields = ["name", "email", "phone", "gender", "dob"];

                fields.forEach(field => {
                  const value = form.elements[field]?.value?.trim();
                  if (value) formData.append(field, value);
                });

                const fileInput = form.elements["profileUrl"];
                if (fileInput?.files?.[0]) {
                  formData.append("profilePhoto", fileInput.files[0]); // backend-friendly key
                }

                try {
                  const res = await learnerApi.updateProfile(formData);
                  console.log(res);
                  if (res.data?.success) {
                    dispatch(learnerUpateProfile(res.data.data));
                    setNotification("Profile updated successfully", "success");
                  }
                  setProfile(prev => ({ ...prev, ...res.data.data }));
                  setShowEditModal(false);
                } catch (err) {
                  setErrors({ submit: err?.response?.data?.message || "Update failed" });
                }
              }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-4">
                <div className="relative w-28 h-28">
                  <img src={previewImage || "https://via.placeholder.com/150"} className="w-full h-full object-cover rounded-full border" />
                  <label htmlFor="profile-upload" className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer">
                    <Pencil size={16} />
                  </label>
                  <input
                    id="profile-upload"
                    name="profileUrl"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) setPreviewImage(URL.createObjectURL(e.target.files[0]));
                    }}
                  />
                </div>
              </div>

              <input defaultValue={profile?.name} name="name" placeholder="Full Name" className="w-full border rounded-lg p-2" />

              <input defaultValue={profile?.email} name="email" type="email" placeholder="Email" className="w-full border rounded-lg p-2" />

              <input defaultValue={profile?.phone || ""} name="phone" placeholder="Phone Number" className="w-full border rounded-lg p-2" />

              <select defaultValue={profile?.gender || ""} name="gender" className="w-full border rounded-lg p-2">
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>

              <input name="dob" type="date" defaultValue={profile?.dob?.split("T")[0] || ""} className="w-full border rounded-lg p-2" />

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-chill-600 text-white rounded-lg hover:bg-blue-chill-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
