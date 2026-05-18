"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  
  // --- GÜVENLİK (TANRI MODU KİLİDİ) ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [authError, setAuthError] = useState(false);

  // --- TEMEL DURUMLAR ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- İSTATİSTİK SİNYALLERİ ---
  const [totalPosts, setTotalPosts] = useState(0);
  const [hubs, setHubs] = useState([]);
  
  // --- YENİ KABİLE OLUŞTURMA FORMU ---
  const [newHub, setNewHub] = useState({
    name: "",
    category: "",
    description: "",
    icon: "🔥"
  });
  const [isCreating, setIsCreating] = useState(false);

  // --- KULLANICI ARAMA VE DÜZENLEME ---
  const [searchedEmail, setSearchedEmail] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [editRoles, setEditRoles] = useState([]);
  const [editKarma, setEditKarma] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- YENİ EKLENEN: GERİ BİLDİRİM KUTUSU ---
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) { router.push("/login"); return; }

      try {
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        const userData = await userRes.json();
        
        if (userRes.ok) {
          setUser(userData);
        } else {
          router.push("/login");
          return;
        }

        const postsRes = await fetch("https://sinerjihub-1.onrender.com/api/posts/all");
        const postsData = await postsRes.json();
        setTotalPosts(postsData.length);

        const hubsRes = await fetch("https://sinerjihub-1.onrender.com/api/hubs/all");
        const hubsData = await hubsRes.json();
        setHubs(hubsData);

      } catch (error) {
        console.error("Admin verileri çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  // --- ŞİFRE KONTROL MOTORU VE FEEDBACKLERİ ÇEKME ---
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passkey })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAuthError(false);
        // Giriş başarılıysa arka planda hemen Geri Bildirimleri de çek!
        fetchFeedbacks(passkey);
      } else {
        setAuthError(true);
        setPasskey("");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı. Backend rotalarını kontrol et dostum.");
    }
  };

  // --- YENİ: GERİ BİLDİRİMLERİ SUNUCUDAN GETİR ---
  const fetchFeedbacks = async (adminKey) => {
    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/feedback/all", {
        headers: { "x-admin-password": adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Geri bildirimler çekilemedi.", err);
    }
  };

  // --- YENİ: GERİ BİLDİRİM DURUMUNU GÜNCELLE ---
  const handleUpdateFeedbackStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/feedback/update-status/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": passkey
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Arayüzdeki listeyi anında güncelle
        setFeedbacks(feedbacks.map(f => f._id === id ? data.feedback : f));
      }
    } catch (err) {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  const handleCreateHub = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/hubs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHub),
      });

      if (res.ok) {
        const createdHub = await res.json();
        alert(`Sistem mesajı: ${createdHub.name} kabilesi ekosisteme başarıyla eklendi! 🚀`);
        setHubs([...hubs, createdHub]);
        setNewHub({ name: "", category: "", description: "", icon: "🔥" }); 
      } else {
        alert("Kabile oluşturulamadı. Sunucuyu kontrol et.");
      }
    } catch (err) {
      alert("Bağlantı hatası!");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchError("");
    setFoundUser(null);
    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/admin/search-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": passkey 
        },
        body: JSON.stringify({ email: searchedEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setFoundUser(data);
        setEditKarma(data.karmaPoints || 0);
        setEditRoles(data.roles || ["Gezgin"]);
      } else {
        setSearchError(data.message);
      }
    } catch (err) {
      setSearchError("Ağ hatası, sorgulama başarısız.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/admin/update-user/${foundUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": passkey
        },
        body: JSON.stringify({ roles: editRoles, karmaPoints: Number(editKarma) })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Sistem Mesajı: Kullanıcı başarıyla güncellendi! Yüce Kurucu gücünü gösterdi. ⚡");
        setFoundUser(data.user);
      } else {
        alert(data.message || "Güncelleme başarısız.");
      }
    } catch (err) {
      alert("Sistem bağlantı hatası!");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleRole = (role) => {
    if (editRoles.includes(role)) {
      setEditRoles(editRoles.filter(r => r !== role)); 
    } else {
      setEditRoles([...editRoles, role]); 
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white flex-col">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
      <p className="text-red-500 font-black tracking-[0.3em] uppercase text-[10px] animate-pulse">Tanrı Modu Yükleniyor...</p>
    </div>
  );

  // --- EĞER ŞİFRE GİRİLMEDİYSE KİLİT EKRANINI GÖSTER ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-red-500/30 bg-grid-red-900/[0.02]">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-red-900/30 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
          
          <div className="text-6xl mb-6">🛡️</div>
          <h2 className="text-2xl font-black tracking-tighter mb-2 italic uppercase text-gray-200">YETKİ ONAYI GEREKLİ</h2>
          <p className="text-red-500/70 font-bold text-xs uppercase tracking-widest mb-8">Erişim sadece kuruculara açıktır.</p>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <input
                type="password"
                required
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className={`w-full bg-gray-900/50 border ${authError ? 'border-red-500' : 'border-gray-800'} rounded-2xl px-5 py-4 text-center text-xl text-white outline-none focus:border-red-500/50 transition-all tracking-[0.3em]`}
                placeholder="••••••••"
              />
              {authError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-3">Geçersiz Kod! Yetkisiz Erişim Denemesi.</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95"
            >
              Şifreyi Çöz
            </button>
          </form>
          
          <Link href="/dashboard" className="block mt-8 text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors">
            ← Ana Üsse Dön
          </Link>
        </div>
      </div>
    );
  }

  // --- ŞİFRE DOĞRUYSA ANA PANELİ GÖSTER ---
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30 overflow-y-auto bg-grid-red-900/[0.03] pb-20">
      
      <nav className="border-b border-red-900/50 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🛡️</span>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 tracking-tighter uppercase">
              SINERJIHUB OTOKONTROL
            </h1>
          </div>
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2 border border-gray-800 hover:border-red-900/50 px-4 py-2 rounded-lg">
            <span>←</span> Ekosisteme Dön
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        <header className="mb-12">
          <h2 className="text-4xl font-black tracking-tighter mb-2 italic text-gray-100">SİSTEM MERKEZİ</h2>
          <p className="text-red-500/70 font-bold text-xs uppercase tracking-widest">Yetki Seviyesi: Kurucu (Level 99)</p>
        </header>

        {/* İSTATİSTİK PANELLERİ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-gray-900 to-[#0a0a0a] border border-red-900/30 p-8 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-600/10 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all"></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Toplam Kabile</p>
            <p className="text-5xl font-black text-red-500">{hubs.length}</p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-[#0a0a0a] border border-orange-900/30 p-8 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl group-hover:bg-orange-600/20 transition-all"></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Sinerji İlanları</p>
            <p className="text-5xl font-black text-orange-500">{totalPosts}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-[#0a0a0a] border border-green-900/30 p-8 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-600/10 rounded-full blur-2xl group-hover:bg-green-600/20 transition-all"></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Gelen Bildirim</p>
            <p className="text-5xl font-black text-green-500">{feedbacks.filter(f => f.status === 'Beklemede').length}</p>
          </div>
        </div>

        {/* --- GEZGİN SORGULAMA VE YETKİLENDİRME --- */}
        <div className="bg-[#0a0a0a] border border-red-900/40 p-8 md:p-10 rounded-[2.5rem] shadow-2xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          <h3 className="text-xl font-black mb-6 tracking-tight text-gray-200 border-b border-red-900/30 pb-4 flex items-center gap-3">
            <span>🔍</span> GEZGİN SORGULAMA VE YETKİLENDİRME
          </h3>
          
          <form onSubmit={handleSearchUser} className="flex flex-col md:flex-row gap-4 mb-8 relative z-10">
            <input
              type="email"
              required
              value={searchedEmail}
              onChange={(e) => setSearchedEmail(e.target.value)}
              className="flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-red-500/50 transition-all"
              placeholder="Kullanıcı e-posta adresini gir (Örn: admin@sinerjihub.com)"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 disabled:opacity-50"
            >
              {isSearching ? "Aranıyor..." : "Gezgini Bul"}
            </button>
          </form>

          {searchError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-4">{searchError}</p>}

          {foundUser && (
            <div className="bg-gray-900/50 border border-red-900/30 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 relative z-10">
              <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-6">
                <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center font-black text-2xl border border-red-500/30 overflow-hidden">
                  {foundUser.profilePicture ? <img src={foundUser.profilePicture} className="w-full h-full object-cover" /> : foundUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-white">{foundUser.username}</h4>
                  <p className="text-gray-500 text-xs font-bold tracking-widest">{foundUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Sinerji (Karma) Puanı</label>
                  <input
                    type="number"
                    required
                    value={editKarma}
                    onChange={(e) => setEditKarma(e.target.value)}
                    className="w-full md:w-1/3 bg-[#050505] border border-gray-800 rounded-xl px-5 py-3 text-lg font-black text-red-400 outline-none focus:border-red-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-2">Özel Rütbeler (Taglar)</label>
                  <div className="flex flex-wrap gap-3">
                    {["Gezgin", "Kurucu", "Moderatör", "Gamer", "Kemik Tayfa"].map(role => {
                      const isActive = editRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all border ${
                            isActive 
                              ? "bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.2)]" 
                              : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {role} {isActive && "✓"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] active:scale-95 disabled:opacity-50 mt-4"
                >
                  {isUpdating ? "Sisteme Yazılıyor..." : "Değişiklikleri Sisteme Yaz"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* --- YENİ EKLENEN: GELEN İSTEK VE ÖNERİLER (FEEDBACK INBOX) --- */}
        <div className="bg-[#0a0a0a] border border-orange-900/40 p-8 md:p-10 rounded-[2.5rem] shadow-2xl mb-12 relative overflow-hidden">
           <h3 className="text-xl font-black mb-8 tracking-tight text-gray-200 border-b border-orange-900/30 pb-4 flex items-center gap-3">
            <span>📬</span> GELEN İSTEK VE ÖNERİLER
          </h3>

          <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {feedbacks.length === 0 ? (
              <p className="text-gray-600 text-sm font-medium italic text-center py-8">Henüz hiçbir geri bildirim yok.</p>
            ) : (
              feedbacks.map(fb => {
                let statusColor = "text-gray-500 bg-gray-800 border-gray-700";
                if (fb.status === "Beklemede") statusColor = "text-orange-400 bg-orange-900/20 border-orange-500/30";
                if (fb.status === "İncelendi") statusColor = "text-blue-400 bg-blue-900/20 border-blue-500/30";
                if (fb.status === "Tamamlandı") statusColor = "text-green-400 bg-green-900/20 border-green-500/30";

                return (
                  <div key={fb._id} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl flex flex-col hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mr-3">@{fb.username}</span>
                        <span className="text-[9px] font-black bg-gray-800 px-2 py-1 rounded text-gray-300 border border-gray-700">{fb.type}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-black uppercase">{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 leading-relaxed font-medium mb-6">{fb.content}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${statusColor}`}>
                        {fb.status}
                      </span>
                      
                      <div className="flex gap-2">
                        {fb.status === "Beklemede" && (
                          <button onClick={() => handleUpdateFeedbackStatus(fb._id, "İncelendi")} className="text-[9px] font-black uppercase bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg transition-all">
                            İncelemeye Al
                          </button>
                        )}
                        {fb.status !== "Tamamlandı" && (
                          <button onClick={() => handleUpdateFeedbackStatus(fb._id, "Tamamlandı")} className="text-[9px] font-black uppercase bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg transition-all">
                            Tamamlandı Yap
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* YENİ KABİLE OLUŞTURMA FORMU */}
          <div className="bg-[#0a0a0a] border border-red-900/20 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xl font-black mb-8 tracking-tight text-gray-200 border-b border-red-900/30 pb-4">YENİ KABİLE İNŞA ET</h3>
            
            <form onSubmit={handleCreateHub} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Kabile Adı</label>
                <input
                  type="text"
                  required
                  value={newHub.name}
                  onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-red-500/50 transition-all"
                  placeholder="Örn: React Geliştiricileri"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Kategori Etiketi</label>
                  <input
                    type="text"
                    required
                    value={newHub.category}
                    onChange={(e) => setNewHub({ ...newHub, category: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-red-500/50 transition-all"
                    placeholder="Örn: YAZILIM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">İkon (Emoji)</label>
                  <input
                    type="text"
                    required
                    value={newHub.icon}
                    onChange={(e) => setNewHub({ ...newHub, icon: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-2xl text-center text-white outline-none focus:border-red-500/50 transition-all"
                    placeholder="💻"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Kabile Açıklaması</label>
                <textarea
                  required
                  value={newHub.description}
                  onChange={(e) => setNewHub({ ...newHub, description: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-red-500/50 transition-all h-28 resize-none"
                  placeholder="Bu kabile ne için var? Sinerji amacı nedir?"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 disabled:opacity-50"
              >
                {isCreating ? "INŞA EDILIYOR..." : "KABİLEYİ YARAT"}
              </button>
            </form>
          </div>

          {/* MEVCUT KABİLELER LİSTESİ */}
          <div className="bg-[#0a0a0a] border border-gray-800/50 p-8 md:p-10 rounded-[2.5rem]">
            <h3 className="text-xl font-black mb-8 tracking-tight text-gray-200 border-b border-gray-800 pb-4">AKTİF KABİLELER ({hubs.length})</h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {hubs.length === 0 ? (
                <p className="text-xs text-gray-600 font-medium">Sistemde henüz bir kabile yok.</p>
              ) : (
                hubs.map(hub => (
                  <div key={hub._id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex items-center justify-between group hover:border-gray-600 transition-all">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl bg-gray-800 w-12 h-12 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">{hub.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-gray-200">{hub.name}</h4>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{hub.category} • {hub.members?.length || 0} Üye</span>
                      </div>
                    </div>
                    <Link href={`/hubs/${hub._id}`} className="text-[10px] font-black bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-700 hover:text-white transition-all uppercase tracking-widest">
                      İncele
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}