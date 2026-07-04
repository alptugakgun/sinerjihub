"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userHubs, setUserHubs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // --- GERİ BİLDİRİM (FEEDBACK) DURUMLARI ---
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("Öneri");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // --- YENİ EKLENEN: PROFİL DÜZENLEME DURUMLARI ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    github: "",
    linkedin: "",
    website: "",
    interests: "" // Virgülle ayrılmış string olarak tutacağız
  });

  // --- PROFİL VE PORTFOLYO VERİ MOTORU ---
  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId || userId === "undefined") {
        router.push("/login");
        return;
      }

      try {
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`, { credentials: "include" });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          // Edit formunu kullanıcının mevcut verileriyle doldur
          setEditForm({
            bio: userData.bio || "",
            github: userData.socialLinks?.github || "",
            linkedin: userData.socialLinks?.linkedin || "",
            website: userData.socialLinks?.website || "",
            interests: userData.interests?.join(", ") || ""
          });
        } else {
          localStorage.removeItem("userId");
          router.push("/login");
          return;
        }

        const postsRes = await fetch("https://sinerjihub-1.onrender.com/api/posts/all", { credentials: "include" });
        if (postsRes.ok) {
          const allPosts = await postsRes.json();
          const myPosts = allPosts.filter(post => post.user === userId);
          setUserPosts(myPosts);

          const skillsSet = new Set();
          myPosts.forEach(post => {
            if (post.tags) {
              post.tags.forEach(tag => skillsSet.add(tag.toUpperCase()));
            }
          });
          setUserSkills(Array.from(skillsSet));
        }

        const hubsRes = await fetch("https://sinerjihub-1.onrender.com/api/hubs/all", { credentials: "include" });
        if (hubsRes.ok) {
          const allHubs = await hubsRes.json();
          const myHubs = allHubs.filter(hub => hub.members.some(member => member._id === userId));
          setUserHubs(myHubs);
        }

      } catch (error) {
        toast.error("Profil verileri çekilemedi.", { style: { background: '#7f1d1d', color: '#fff' } });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  // --- FOTOĞRAF GÜNCELLEME MOTORU (BASE64) ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Fotoğraf boyutu çok büyük dostum! Maksimum 2MB.", { style: { background: '#7f1d1d', color: '#fff' } });
      e.target.value = null;
      return;
    }

    setIsUploading(true);
    const userId = localStorage.getItem("userId");

    const reader = new FileReader();
    reader.readAsDataURL(file); 
    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        const res = await fetch(`https://sinerjihub-1.onrender.com/api/auth/update-avatar/${userId}`, {
        credentials: "include",
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePicture: base64Image }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Profil fotoğrafın başarıyla güncellendi! 🎉", { style: { background: '#1f2937', color: '#fff' } });
          setUser({ ...user, profilePicture: base64Image });
        } else {
          toast.error(data.message || "Fotoğraf yüklenemedi.");
        }
      } catch (err) {
        toast.error("Sunucuyla bağlantı hatası oluştu.");
      } finally {
        setIsUploading(false);
      }
    };
  };

  // --- YENİ EKLENEN: PROFİL BİLGİLERİNİ GÜNCELLEME MANTIK MOTORU ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const userId = localStorage.getItem("userId");

    // Virgülle ayrılmış interests alanını diziye çevir
    const interestsArray = editForm.interests.split(",").map(i => i.trim()).filter(i => i !== "");

    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/auth/update-profile/${userId}`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: editForm.bio,
          socialLinks: {
            github: editForm.github,
            linkedin: editForm.linkedin,
            website: editForm.website
          },
          interests: interestsArray
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profilin başarıyla güncellendi! 🚀");
        setUser(data.user);
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || "Güncelleme başarısız.");
      }
    } catch (err) {
      toast.error("Sunucu bağlantı hatası.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- GERİ BİLDİRİM GÖNDERME FONKSİYONU ---
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    setIsSubmittingFeedback(true);
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/feedback/submit", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          username: user.username,
          content: feedbackContent,
          type: feedbackType
        }),
      });

      if (res.ok) {
        toast.success("Mesajın kuruculara iletildi! Katkın için teşekkürler. 🚀");
        setFeedbackContent("");
        setFeedbackType("Öneri");
      }
    } catch (err) {
      toast.error("Bağlantı hatası! Sisteme ulaşılamıyor.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getKarmaRank = (karma) => {
    if (karma < 50) return { title: "Sinerji Çaylağı", icon: "🌱", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10", desc: "Ekosisteme yeni adım atmış, keşfetmeye aç." };
    if (karma < 150) return { title: "Ağ Gezgini", icon: "🌍", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", desc: "Bağlantılar kuran ve özel kabile inşa edebilen deneyimli gezgin." };
    if (karma < 500) return { title: "Sistem Katalizörü", icon: "⚡", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", desc: "Topluluğu hızlandıran, kilit bilgiler paylaşan lider adayı." };
    return { title: "Ekosistem Lideri", icon: "👑", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", desc: "SinerjiHub'ın zirvesi. Stratejik trendlerin belirleyicisi." };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/login");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-black tracking-widest uppercase text-[10px]">Dijital CV Yükleniyor...</p>
    </div>
  );

  const userRank = getKarmaRank(user?.karmaPoints || 0);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden pb-20 md:pb-0">
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- PROFİL DÜZENLEME MODALI --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-6 tracking-tight text-white">Profilini Şekillendir 🛠️</h3>
            
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Hakkımda (Bio)</label>
                <textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})} 
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 h-24 resize-none" 
                  placeholder="Kısaca kendinden bahset..." 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">İlgi Alanları (Virgülle ayır)</label>
                <input 
                  type="text" 
                  value={editForm.interests} 
                  onChange={(e) => setEditForm({...editForm, interests: e.target.value})} 
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" 
                  placeholder="Yazılım, Kimya, Tasarım..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">GitHub URL</label>
                  <input type="text" value={editForm.github} onChange={(e) => setEditForm({...editForm, github: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">LinkedIn URL</label>
                  <input type="text" value={editForm.linkedin} onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Kişisel Web Sitesi</label>
                  <input type="text" value={editForm.website} onChange={(e) => setEditForm({...editForm, website: e.target.value})} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500" placeholder="https://..." />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isUpdatingProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                  {isUpdatingProfile ? "GÜNCELLENİYOR..." : "KAYDET"}
                </button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                  İPTAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/40 to-transparent -z-10"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <header className="px-8 py-6 max-w-7xl mx-auto flex justify-between items-center z-10 relative">
        <Link href="/dashboard" className="flex items-center gap-3 text-gray-400 hover:text-white transition-all group">
          <span className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Ana Üsse Dön</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsEditModalOpen(true)} className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl transition-all">
            Profili Düzenle
          </button>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl transition-all">
            Sistemden Çık
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col xl:flex-row gap-12 relative z-10 mt-4">
        
        <aside className="w-full xl:w-96 flex-shrink-0 space-y-8">
          
          <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-20"></div>
            
            <div className="relative group cursor-pointer w-32 h-32 mx-auto rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] border-4 border-[#0a0f1c] z-10 mb-6 overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-4xl">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0].toUpperCase()
              )}
              
              <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest text-white transition-opacity duration-200 cursor-pointer">
                <span>{isUploading ? "..." : "Değiştir 📸"}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
            
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">{user?.username}</h1>
            <p className="text-gray-400 text-xs font-medium tracking-widest mb-4">{user?.email}</p>

            {/* --- YENİ EKLENEN: BİO VE SOSYAL MEDYA LİNKLERİ --- */}
            {user?.bio && (
              <p className="text-sm text-gray-300 font-medium italic mb-5 px-2">"{user.bio}"</p>
            )}

            <div className="flex justify-center gap-3 mb-6">
              {user?.socialLinks?.github && <a href={user.socialLinks.github} target="_blank" className="w-8 h-8 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-all text-xs" title="GitHub">GH</a>}
              {user?.socialLinks?.linkedin && <a href={user.socialLinks.linkedin} target="_blank" className="w-8 h-8 bg-blue-900 border border-blue-700 rounded-full flex items-center justify-center text-blue-400 hover:text-white hover:border-blue-500 transition-all text-xs" title="LinkedIn">IN</a>}
              {user?.socialLinks?.website && <a href={user.socialLinks.website} target="_blank" className="w-8 h-8 bg-green-900 border border-green-700 rounded-full flex items-center justify-center text-green-400 hover:text-white hover:border-green-500 transition-all text-xs" title="Website">🌐</a>}
            </div>

            <div className={`flex flex-col items-center gap-2 ${userRank.bg} border ${userRank.border} p-4 rounded-2xl mb-8`}>
              <span className="text-4xl mb-2">{userRank.icon}</span>
              <span className={`text-xs font-black uppercase tracking-widest ${userRank.color}`}>{userRank.title}</span>
              <span className="text-2xl font-black text-white">{user?.karmaPoints || 0} <span className="text-[10px] text-gray-500">KARMA</span></span>
              <p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">{userRank.desc}</p>
            </div>

            <div className="flex justify-between items-center text-center border-t border-gray-700/50 pt-6">
              <div><p className="text-2xl font-black text-indigo-400">{userPosts.length}</p><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Çağrı</p></div>
              <div className="w-[1px] h-8 bg-gray-700"></div>
              <div><p className="text-2xl font-black text-purple-400">{userHubs.length}</p><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Kabile</p></div>
              <div className="w-[1px] h-8 bg-gray-700"></div>
              <div><p className="text-2xl font-black text-green-400">{user?.friends?.length || 0}</p><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Ağ</p></div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2"><span>🚀</span> İLGİ ALANLARI & YETENEKLER</h3>
            <div className="flex flex-wrap gap-2">
              {user?.interests?.length > 0 ? (
                user.interests.map((skill, idx) => (
                  <span key={idx} className="bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase">#{skill}</span>
                ))
              ) : userSkills.length === 0 ? (
                <p className="text-[10px] text-gray-600 font-medium italic">Henüz bir yetenek sinyali bırakmadın. Profilini düzenle veya ilanlarında etiket kullan!</p>
              ) : (
                userSkills.map((skill, idx) => (
                  <span key={idx} className="bg-gray-900 border border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase">#{skill}</span>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          
          <div>
            <h3 className="text-xl font-black tracking-tight italic text-white flex items-center gap-3 mb-6">KABİLE AĞI <span className="h-[1px] flex-1 bg-gray-800"></span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userHubs.length === 0 ? (
                <div className="col-span-full bg-gray-800/30 border border-gray-700/50 p-6 rounded-[2rem] text-center"><p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Henüz hiçbir kabileye katılmadın.</p></div>
              ) : (
                userHubs.map(hub => (
                  <div key={hub._id} className="bg-gray-800/30 border border-gray-700/50 p-6 rounded-[2rem] hover:border-indigo-500/50 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-4"><span className="text-4xl">{hub.icon}</span><span className="bg-gray-900 border border-gray-700 px-3 py-1 text-[9px] font-black uppercase text-gray-400 rounded-lg">{hub.category}</span></div>
                    <h4 className="font-bold text-white mb-2">{hub.name} {hub.isPrivate && "🔒"}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-6 flex-1 line-clamp-2">{hub.description}</p>
                    <Link href={`/hubs/${hub._id}`} className="w-full text-center bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 py-3 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">Odaya Gir</Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight italic text-white flex items-center gap-3 mb-6">SİNERJİ YANKILARI (SON ÇAĞRILAR) <span className="h-[1px] flex-1 bg-gray-800"></span></h3>
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="bg-gray-800/30 border border-gray-700/50 p-6 rounded-[2rem] text-center"><p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Henüz ekosisteme bir çağrı fırlatmadın.</p></div>
              ) : (
                userPosts.map(post => (
                  <div key={post._id} className="bg-gray-800/30 border border-gray-700/50 p-6 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{formatDate(post.createdAt)}</span>
                      <span className="text-[10px] bg-gray-900 border border-gray-700 px-3 py-1 rounded-lg text-gray-400 font-black">🙌 {post.upvotes?.length || 0} DESTEK</span>
                    </div>
                    <p className="text-sm text-gray-300 font-medium leading-relaxed mb-4">{post.content}</p>
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* GERİ BİLDİRİM KUTUSU */}
          <div className="bg-indigo-900/10 border border-indigo-500/30 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-[120px] opacity-5">📬</div>
            <h3 className="text-lg font-black tracking-tight italic text-indigo-300 flex items-center gap-3 mb-2 relative z-10">EKOSİSTEMİ ŞEKİLLENDİR</h3>
            <p className="text-xs text-gray-400 font-medium mb-6 relative z-10">SinerjiHub senin fikirlerinle büyüyor. Kuruculara doğrudan ulaş!</p>

            <form onSubmit={handleFeedbackSubmit} className="relative z-10 space-y-4">
              <div className="flex gap-4">
                <select 
                  value={feedbackType} 
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 outline-none focus:border-indigo-500"
                >
                  <option value="Öneri">💡 Öneri</option>
                  <option value="İstek">🚀 İstek (Yeni Özellik)</option>
                  <option value="Hata Bildirimi">🐛 Hata Bildirimi</option>
                  <option value="Diğer">✉️ Diğer</option>
                </select>
              </div>

              <textarea 
                required
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="Aklındaki nedir? Bize anlat..."
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-indigo-500 h-28 resize-none"
              />

              <button 
                type="submit" 
                disabled={isSubmittingFeedback}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3.5 rounded-xl uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
              >
                {isSubmittingFeedback ? "Gönderiliyor..." : "Kuruculara İlet"}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}