"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

export default function ExplorePage() {
  const router = useRouter();
  
  // --- TEMEL DURUMLAR (STATES) ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hubs, setHubs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("hubs"); // 'hubs', 'radar', veya 'users'
  const [usersList, setUsersList] = useState([]);

  // --- KABİLE KURMA MODALI ---
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [hubForm, setHubForm] = useState({ name: "", category: "", description: "", icon: "🔥", isPrivate: false, passcode: "" });
  const [isCreatingHub, setIsCreatingHub] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId || userId === "undefined") { router.push("/login"); return; }

      try {
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`, { credentials: "include" });
        const userData = await userRes.json();
        if (userRes.ok) { setUser(userData); } else { router.push("/login"); return; }

        const hubsRes = await fetch("https://sinerjihub-1.onrender.com/api/hubs/all", { credentials: "include" });
        setHubs(await hubsRes.json());

        const recRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/recommendations/${userId}`, { credentials: "include" });
        setRecommendations(await recRes.json());

      } catch (error) { 
        console.error("Veri yüklenirken hata oluştu:", error); 
        toast.error("Keşif modülleri yüklenemedi.", { style: { background: '#7f1d1d', color: '#fff' } });
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users' && searchQuery.length > 0) {
      const fetchUsers = async () => {
        try {
          const res = await fetch(`https://sinerjihub-1.onrender.com/api/auth/search?q=${searchQuery}`);
          if (res.ok) {
            setUsersList(await res.json());
          }
        } catch (err) { console.error(err); }
      };
      const timeoutId = setTimeout(() => fetchUsers(), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setUsersList([]);
    }
  }, [searchQuery, activeTab]);

  const handleCreateHub = async (e) => {
    e.preventDefault();
    if (user?.karmaPoints < 50 && !user?.roles?.includes("Kurucu")) {
      toast.error("Bunun için en az 50 Karma (Ağ Gezgini) olmalısın!", { style: { background: '#7f1d1d', color: '#fff' } });
      return;
    }
    
    setIsCreatingHub(true);
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/hubs/create", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...hubForm, creatorId: userId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setHubs([...hubs, data]);
        setUser({ ...user, hubs: [...(user.hubs || []), data._id] });
        setIsHubModalOpen(false);
        setHubForm({ name: "", category: "", description: "", icon: "🔥", isPrivate: false, passcode: "" });
        toast.success(`${data.name} kabilesi başarıyla inşa edildi!`, { style: { background: '#1f2937', color: '#fff' } });
      } else {
        toast.error(data.message || "Kabile kurulamadı.", { style: { background: '#7f1d1d', color: '#fff' } });
      }
    } catch (err) {
      toast.error("Sunucu bağlantı hatası.", { style: { background: '#7f1d1d', color: '#fff' } });
    }
    setIsCreatingHub(false);
  };

  const handleJoinHub = async (hubId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/hubs/join", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hubId }),
      });
      if (res.ok) {
        toast.success("Kabileye başarıyla katıldın!", { style: { background: '#1f2937', color: '#fff' } });
        setUser({ ...user, hubs: [...(user.hubs || []), hubId], karmaPoints: (user.karmaPoints || 0) + 10 });
      } else {
          const data = await res.json();
          toast.error(data.message, { style: { background: '#7f1d1d', color: '#fff' } });
      }
    } catch (err) { console.error(err); }
  };

  const handleSendFriendRequest = async (targetId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/request/${userId}/${targetId}`, {
        credentials: "include", method: "POST" });
      const data = await res.json();
      toast.success(data.message, { style: { background: '#1f2937', color: '#fff' } });
      setRecommendations(recommendations.filter(rec => rec._id !== targetId));
    } catch (err) { alert("İstek gönderilemedi."); }
  };

  const filteredHubs = hubs.filter(hub => 
    hub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    hub.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Keşif Radarı Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans pb-20 md:pb-0 bg-[#050505] text-white selection:bg-indigo-500/30">
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- KABİLE KURMA MODALI (BURAYA TAŞINDI) --- */}
      {isHubModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-indigo-500/30 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            <h3 className="text-2xl font-black mb-6 tracking-tight text-white flex items-center gap-2">Kendi Kabileni İnşa Et 👑</h3>
            <form onSubmit={handleCreateHub} className="space-y-4 relative z-10">
              <div className="flex gap-4">
                <input type="text" required value={hubForm.icon} onChange={(e) => setHubForm({...hubForm, icon: e.target.value})} className="w-16 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center text-2xl text-white outline-none focus:border-indigo-500" placeholder="🔥" />
                <input type="text" required value={hubForm.name} onChange={(e) => setHubForm({...hubForm, name: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500" placeholder="Kabile Adı" />
              </div>
              <input type="text" required value={hubForm.category} onChange={(e) => setHubForm({...hubForm, category: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500" placeholder="Kategori (Örn: Yazılım)" />
              <textarea required value={hubForm.description} onChange={(e) => setHubForm({...hubForm, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500 h-24 resize-none" placeholder="Odanın amacı nedir?" />
              <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                <input type="checkbox" id="isPrivate" checked={hubForm.isPrivate} onChange={(e) => setHubForm({...hubForm, isPrivate: e.target.checked})} className="w-4 h-4 accent-indigo-500" />
                <label htmlFor="isPrivate" className="text-sm font-bold text-gray-300 cursor-pointer">Bu kabile şifreli ve özel olsun 🔒</label>
              </div>
              {hubForm.isPrivate && (
                <input type="text" required value={hubForm.passcode} onChange={(e) => setHubForm({...hubForm, passcode: e.target.value})} className="w-full bg-indigo-900/20 border border-indigo-500/50 rounded-2xl p-4 text-sm text-indigo-300 outline-none focus:border-indigo-400 font-mono tracking-widest" placeholder="Şifre Belirle" />
              )}
              <button disabled={isCreatingHub} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-sm text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 mt-2">{isCreatingHub ? "İNŞA EDİLİYOR..." : "KABİLEYİ YARAT"}</button>
              <button type="button" onClick={() => setIsHubModalOpen(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-gray-300">Vazgeç</button>
            </form>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-gray-900/40 border-r border-gray-800/50 hidden md:flex flex-col p-8 backdrop-blur-2xl h-screen sticky top-0 z-10">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 mb-12 tracking-tighter italic">SINERJIHUB</h1>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-4 text-gray-400 hover:bg-gray-800 px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:scale-110">🏠</span> <span className="font-medium text-sm">Ana Üs</span>
          </Link>
          <Link href="/explore" className="flex items-center gap-4 bg-indigo-600/10 px-5 py-4 rounded-2xl border border-indigo-500/20 group">
            <span className="text-xl">🧭</span> <span className="font-bold text-sm text-white">Keşfet</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-4 text-gray-400 hover:bg-gray-800 px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:rotate-12">👤</span> <span className="font-medium text-sm">Profil</span>
          </Link>
        </nav>
      </aside>

      {/* --- ANA KEŞİF AKIŞI --- */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-grid-slate-900/[0.04] custom-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 italic text-white">
              SİNERJİ KEŞİF MERKEZİ 🧭
            </h2>
            <p className="text-gray-500 font-medium text-sm">Yeni kabileler bul veya seninle aynı vizyona sahip gezginlerle eşleş.</p>
          </div>
          <button onClick={() => setIsHubModalOpen(true)} className="bg-indigo-600 px-8 py-3.5 rounded-2xl font-black text-xs text-white tracking-widest shadow-xl hover:-translate-y-1 transition-all uppercase whitespace-nowrap">+ Kabile Kur</button>
        </header>

        {/* --- ARAMA ÇUBUĞU --- */}
        <div className="relative max-w-4xl mb-12">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔍</span>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder={activeTab === 'users' ? "Kullanıcı adı ara..." : "Kabile veya konu ara..."} 
            className="w-full bg-gray-800/40 border border-gray-700/50 rounded-full pl-14 pr-6 py-5 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-gray-800/80 transition-all shadow-inner backdrop-blur-sm" 
            disabled={activeTab === 'radar'}
          />
        </div>

        {/* --- TAB KONTROLLERİ --- */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-800 pb-4">
          <button onClick={() => setActiveTab('hubs')} className={`text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'hubs' ? 'text-indigo-400 border-b-2 border-indigo-400 pb-2' : 'text-gray-500 hover:text-gray-300'}`}>Kabileler</button>
          <button onClick={() => setActiveTab('radar')} className={`text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'radar' ? 'text-purple-400 border-b-2 border-purple-400 pb-2' : 'text-gray-500 hover:text-gray-300'}`}>Sinerji Radarı</button>
          <button onClick={() => setActiveTab('users')} className={`text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-green-400 border-b-2 border-green-400 pb-2' : 'text-gray-500 hover:text-gray-300'}`}>Gezginler (Arama)</button>
        </div>

        {/* --- KABİLELER LİSTESİ --- */}
        {activeTab === 'hubs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHubs.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-gray-800/20 rounded-[2rem] border border-gray-800">
                <p className="text-gray-500 font-medium">Aramana uygun bir kabile bulunamadı.</p>
              </div>
            ) : (
              filteredHubs.map(hub => (
                <div key={hub._id} className="bg-gray-800/30 border border-gray-700 p-6 rounded-[2rem] hover:border-indigo-500/50 transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                      <span className="text-5xl group-hover:scale-110 transition-transform">{hub.icon}</span>
                      <span className="text-[9px] font-black bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-xl text-gray-400 uppercase tracking-widest">{hub.category}</span>
                  </div>
                  <h4 className="font-black text-lg mb-2 text-white flex items-center gap-2">
                      {hub.name} {hub.isPrivate && "🔒"}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6 flex-1">{hub.description}</p>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-700/50">
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{hub.members?.length} Üye</span>
                      {user?.hubs?.includes(hub._id) ? (
                          <Link href={`/hubs/${hub._id}`} className="bg-green-500/10 text-green-400 px-5 py-2.5 rounded-xl text-[10px] font-black border border-green-500/20 hover:bg-green-500 hover:text-white transition-all">ODAYA GİR</Link>
                      ) : (
                          <button onClick={() => handleJoinHub(hub._id)} className="bg-indigo-600 px-5 py-2.5 rounded-xl text-[10px] font-black text-white hover:bg-indigo-500 transition-all shadow-lg">KATIL</button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- SİNERJİ RADARI (YAPAY ZEKA EŞLEŞMELERİ) --- */}
        {activeTab === 'radar' && (
          <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/10 border border-purple-500/30 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute right-0 top-0 text-[150px] opacity-5 pointer-events-none">📡</div>
            <p className="text-gray-400 text-sm mb-8 relative z-10 max-w-2xl leading-relaxed">
              Yapay zeka motorumuz ilgi alanlarını ve yetenek etiketlerini tarayarak ekosistemde seninle aynı vizyonu paylaşan gezginleri buldu. Bağ kur ve sinerjiyi başlat!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {recommendations.length === 0 ? (
                 <p className="text-gray-500 text-sm font-medium italic">Şu an radar bomboş. Profiline ilgi alanları eklersen sistem sana yoldaşlar bulabilir.</p>
              ) : (
                recommendations.map(rec => (
                  <div key={rec._id} className="flex items-center justify-between bg-gray-900/60 p-5 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all group">
                     <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-xl font-black overflow-hidden">
                                {rec.profilePicture ? <img src={rec.profilePicture} className="w-full h-full object-cover"/> : rec.username[0].toUpperCase()}
                            </div>
                          </div>
                          <div>
                              <p className="text-sm font-black text-white">{rec.username}</p>
                              <p className="text-[10px] text-purple-400 font-black tracking-widest uppercase mb-1">{rec.karmaPoints} KARMA</p>
                              <div className="flex flex-wrap gap-1">
                                {rec.interests?.slice(0, 2).map((int, i) => <span key={i} className="text-[8px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">#{int}</span>)}
                              </div>
                          </div>
                     </div>
                     <button onClick={() => handleSendFriendRequest(rec._id)} className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all">BAĞ KUR</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- KULLANICI ARAMA SONUÇLARI --- */}
        {activeTab === 'users' && (
          <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-[2.5rem]">
            {searchQuery.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl block mb-4">👆</span>
                <p className="text-gray-500 text-sm font-medium italic">Kimi arıyorsun? Sayfanın en üstündeki arama çubuğuna kullanıcı adını yaz...</p>
              </div>
            ) : usersList.length === 0 ? (
              <p className="text-gray-500 text-sm font-medium italic text-center py-10">"{searchQuery}" adında bir gezgin bulunamadı.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {usersList.map(u => (
                  <div key={u._id} className="flex items-center justify-between bg-gray-900/60 p-5 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all group">
                     <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-green-600 to-teal-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-xl font-black overflow-hidden">
                                {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover"/> : u.username[0].toUpperCase()}
                            </div>
                          </div>
                          <div>
                              <p className="text-sm font-black text-white">{u.username}</p>
                              <p className="text-[10px] text-green-400 font-black tracking-widest uppercase mb-1">{u.karmaPoints} KARMA</p>
                              <div className="flex flex-wrap gap-1">
                                {u.roles?.map((role, i) => <span key={i} className="text-[8px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{role}</span>)}
                              </div>
                          </div>
                     </div>
                     {user?._id !== u._id && !user?.friends?.includes(u._id) && (
                       <button onClick={() => handleSendFriendRequest(u._id)} className="bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all">BAĞ KUR</button>
                     )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* GLOBAL SCROLLBAR STYLE */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}