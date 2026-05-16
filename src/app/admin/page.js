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
  const SECRET_PASSKEY = "SINERJI2026"; // Kurucu Şifresi (Burayı dilediğin gibi değiştir)

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

  // --- ŞİFRE KONTROL MOTORU ---
  const handleAuth = (e) => {
    e.preventDefault();
    if (passkey === SECRET_PASSKEY) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasskey("");
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
      alert("Bağlantı hatası! Backend API'sinde '/api/hubs/create' rotasının açık olduğundan emin ol.");
    } finally {
      setIsCreating(false);
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30 overflow-y-auto bg-grid-red-900/[0.03]">
      
      {/* ÜST BAR (NAVBAR) */}
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
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Sistem Durumu</p>
            <p className="text-3xl font-black text-green-500 mt-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span> AKTİF
            </p>
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