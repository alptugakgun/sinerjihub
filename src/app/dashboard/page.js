"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function DashboardPage() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  
  const socket = useRef();

  // --- TEMEL DURUMLAR (STATES) ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [hubs, setHubs] = useState([]);
  
  // --- BİLDİRİM VE ARKADAŞLIK DURUMLARI ---
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  
  // --- İLAN AÇMA MODALI DURUMLARI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // --- DM (BİREBİR MESAJLAŞMA) DURUMLARI ---
  const [isDmOpen, setIsDmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [newDm, setNewDm] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);

  // --- ARAMA MOTORU DURUMU ---
  const [searchQuery, setSearchQuery] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isDmOpen) scrollToBottom();
  }, [dmMessages]);

  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getDm", (data) => {
      setArrivalMessage({
        sender: data.sender,
        content: data.content,
        createdAt: Date.now(),
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (arrivalMessage && selectedUser && arrivalMessage.sender === selectedUser._id) {
      setDmMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, selectedUser]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) { router.push("/login"); return; }

      try {
        socket.current.emit("newUser", userId);

        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        const userData = await userRes.json();
        if (userRes.ok) { setUser(userData); } else { router.push("/login"); return; }

        const postsRes = await fetch("https://sinerjihub-1.onrender.com/api/posts/all");
        setPosts(await postsRes.json());

        const hubsRes = await fetch("https://sinerjihub-1.onrender.com/api/hubs/all");
        setHubs(await hubsRes.json());

        const notifRes = await fetch(`https://sinerjihub-1.onrender.com/api/notifications/user/${userId}`);
        setNotifications(await notifRes.json());

        const friendRes = await fetch(`https://sinerjihub-1.onrender.com/api/social/requests/${userId}`);
        setFriendRequests(await friendRes.json());

      } catch (error) { 
        console.error("Veri yüklenirken hata oluştu:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchData();
  }, [router]);

  const handleSendFriendRequest = async (targetId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/request/${userId}/${targetId}`, { method: "POST" });
      const data = await res.json();
      alert(data.message);
    } catch (err) { alert("İstek gönderilemedi."); }
  };

  const handleAcceptFriend = async (friendId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/accept/${userId}/${friendId}`, { method: "POST" });
      if (res.ok) {
        alert("Artık arkadaşsınız! ✨");
        setFriendRequests(friendRequests.filter(req => req._id !== friendId));
        const updatedUser = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`).then(r => r.json());
        setUser(updatedUser);
      }
    } catch (err) { alert("İstek kabul edilemedi."); }
  };

  const openChat = async (targetId, targetUsername) => {
    const userId = localStorage.getItem("userId");
    setSelectedUser({ _id: targetId, username: targetUsername });
    setIsDmOpen(true);
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/messages/between/${userId}/${targetId}`);
      const data = await res.json();
      setDmMessages(data);
    } catch (err) { console.error("Mesajlar yüklenemedi."); }
  };

  const handleSendDm = async (e) => {
    e.preventDefault();
    if (!newDm.trim()) return;
    const userId = localStorage.getItem("userId");
    
    socket.current.emit("sendDm", {
      senderId: userId,
      receiverId: selectedUser._id,
      content: newDm,
    });

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId, receiverId: selectedUser._id, content: newDm }),
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setDmMessages((prev) => [...prev, savedMsg]);
        setNewDm("");
      }
    } catch (err) { alert("Mesaj gönderilemedi."); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    const userId = localStorage.getItem("userId");
    const tagsArray = postTags.split(",").map(tag => tag.trim()).filter(tag => tag !== "");
    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: postContent, tags: tagsArray }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts([newPost, ...posts]);
        setPostContent(""); setPostTags(""); setIsModalOpen(false);
        // İlan açınca karma puanı artışı (Frontend tarafında anlık yansıtma)
        setUser({ ...user, karmaPoints: (user.karmaPoints || 0) + 5 });
      }
    } catch (err) { alert("İlan paylaşılamadı."); }
    setIsPosting(false);
  };

  const handleUpvote = async (postId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/posts/upvote/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setPosts(posts.map(p => p._id === postId ? { ...p, upvotes: [...(p.upvotes || []), userId] } : p));
      }
    } catch (err) { console.error(err); }
  };

  const handleJoinHub = async (hubId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/hubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hubId }),
      });
      if (res.ok) {
        alert("Kabileye başarıyla katıldın!");
        setUser({ ...user, hubs: [...(user.hubs || []), hubId], karmaPoints: (user.karmaPoints || 0) + 10 });
      }
    } catch (err) { console.error(err); }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- YENİ: SİNERJİ RÜTBE HESAPLAYICI (OYUNLAŞTIRMA MOTORU) ---
  const getKarmaRank = (karma) => {
    if (karma < 50) return { title: "Sinerji Çaylağı", icon: "🌱", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" };
    if (karma < 150) return { title: "Ağ Gezgini", icon: "🌍", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" };
    if (karma < 500) return { title: "Sistem Katalizörü", icon: "⚡", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" };
    return { title: "Ekosistem Lideri", icon: "👑", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" };
  };

  const filteredHubs = hubs.filter(hub => 
    hub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    hub.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hub.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Sinerji Yükleniyor...</p>
    </div>
  );

  const totalNotifs = notifications.filter(n=>!n.isRead).length + friendRequests.length;
  const userRank = getKarmaRank(user?.karmaPoints || 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex relative overflow-hidden font-sans pb-20 md:pb-0">
      
      {/* --- DM PENCERESİ --- */}
      {isDmOpen && (
        <div className="fixed bottom-0 right-0 md:right-6 w-full md:w-80 bg-gray-800 border border-gray-700 rounded-t-2xl shadow-2xl z-[70] flex flex-col h-[450px] animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-blue-600 rounded-t-2xl">
            <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> 💬 {selectedUser?.username}
            </span>
            <button onClick={() => setIsDmOpen(false)} className="text-white text-xl hover:text-gray-200 transition-colors">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/40 custom-scrollbar">
            {dmMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === user?._id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed shadow-md ${msg.sender === user?._id ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-700 text-gray-200 rounded-tl-none border border-gray-600/50"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendDm} className="p-3 border-t border-gray-700 bg-gray-800">
            <input 
              type="text" 
              value={newDm} 
              onChange={(e) => setNewDm(e.target.value)}
              placeholder="Mesaj yaz..."
              className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-xs outline-none focus:border-blue-500 transition-all shadow-inner"
              autoComplete="off"
            />
          </form>
        </div>
      )}

      {/* --- BİLDİRİM VE İSTEK AKIŞI --- */}
      {isNotifOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex justify-end">
          <div className="w-full md:w-80 bg-gray-800 h-full p-6 border-l border-gray-700 overflow-y-auto animate-in slide-in-from-right duration-300 custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-lg tracking-tighter italic">SİNERJİ AKIŞI</h3>
              <button onClick={() => setIsNotifOpen(false)} className="text-2xl text-gray-500 hover:text-white transition-colors">&times;</button>
            </div>
            
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Yeni İstekler</h4>
              {friendRequests.length === 0 ? <p className="text-gray-600 text-[10px] font-medium">Bekleyen istek yok.</p> : friendRequests.map(req => (
                <div key={req._id} className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 mb-3 group transition-all hover:border-gray-500">
                  <p className="text-[11px] font-bold mb-3">{req.username.toUpperCase()} Seninle bağ kurmak istiyor.</p>
                  <button onClick={() => handleAcceptFriend(req._id)} className="w-full bg-blue-600 text-[10px] font-black py-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">KABUL ET</button>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Son Etkinlikler</h4>
              {notifications.length === 0 ? <p className="text-gray-600 text-[10px] font-medium">Henüz bildirim yok.</p> : notifications.map(n => (
                <div key={n._id} className="bg-gray-800 border border-gray-700 p-3 rounded-xl mb-2 text-[10px] text-gray-400 leading-relaxed font-medium">
                  {n.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- İLAN AÇMA MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black mb-6 tracking-tight">Yeni Kabile Çağrısı 🚀</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 h-32 resize-none transition-all" placeholder="Ne arıyorsun? Bir çalışma ortağı mı yoksa bir cevap mı?" required />
              <input type="text" value={postTags} onChange={(e) => setPostTags(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all" placeholder="Etiketler (örneğin: Kimya, Yazılım, YKS)" />
              <button disabled={isPosting} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">{isPosting ? "GÖNDERİLİYOR..." : "YAYINLA"}</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-gray-300 transition-colors">Vazgeç</button>
            </form>
          </div>
        </div>
      )}

      {/* --- SOL PANEL (DESKTOP SIDEBAR) --- */}
      <aside className="w-72 bg-gray-800/40 border-r border-gray-700/50 hidden md:flex flex-col p-8 backdrop-blur-2xl h-screen sticky top-0 z-10">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-12 tracking-tighter">SINERJIHUB</h1>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-4 bg-blue-600/10 px-5 py-4 rounded-2xl border border-blue-500/20 group">
            <span className="text-xl">🏠</span> <span className="font-bold text-sm">Ana Üs</span>
          </Link>
          <button onClick={() => setIsNotifOpen(true)} className="w-full flex items-center gap-4 text-gray-400 hover:bg-gray-700/30 px-5 py-4 rounded-2xl relative transition-all group">
            <span className="text-xl group-hover:scale-110 transition-transform">🔔</span> <span className="font-medium text-sm">Akış</span>
            {totalNotifs > 0 && (
              <span className="absolute right-4 bg-red-500 w-2 h-2 rounded-full animate-ping"></span>
            )}
          </button>
          <Link href="/profile" className="flex items-center gap-4 text-gray-400 hover:bg-gray-700/30 px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:rotate-12 transition-transform">👤</span> <span className="font-medium text-sm">Profil</span>
          </Link>
        </nav>
        
        <div className="mt-auto pt-8 border-t border-gray-700/50 flex flex-col gap-4">
          
          {/* YENİ: RÜTBE ROZETİ EKLENDİ */}
          <div className={`flex items-center gap-2 ${userRank.bg} border ${userRank.border} p-3 rounded-2xl justify-center shadow-inner`}>
            <span className="text-lg">{userRank.icon}</span>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest ${userRank.color}`}>{userRank.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-2xl border border-gray-700/50">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white/10 overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0].toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-black truncate text-gray-200">{user?.username.toUpperCase()}</p>
              <p className="text-[9px] text-blue-400 font-black tracking-tighter">{user?.karmaPoints} KARMA</p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("userId"); router.push("/login"); }} className="w-full text-red-500/70 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-400 py-3 transition-all">Sistemden Çık</button>
        </div>
      </aside>

      {/* --- MOBİL ALT NAVİGASYON (BOTTOM BAR) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 z-50 px-6 py-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-400">
          <span className="text-xl">🏠</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Ana Üs</span>
        </Link>
        
        <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center gap-1 -mt-8 relative group">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50 border-4 border-gray-900 group-hover:scale-105 transition-transform">
            <span className="text-2xl text-white">+</span>
          </div>
        </button>

        <button onClick={() => setIsNotifOpen(true)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors relative">
          <span className="text-xl">🔔</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Akış</span>
          {totalNotifs > 0 && (
             <span className="absolute top-0 right-1 bg-red-500 w-2 h-2 rounded-full border border-gray-900"></span>
          )}
        </button>

        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-gray-600 bg-gray-800 flex items-center justify-center text-[10px] font-bold">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0].toUpperCase()
            )}
          </div>
        </Link>
      </nav>

      {/* --- ANA AKIŞ --- */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 italic flex items-center gap-3 flex-wrap">
              HOŞ GELDİN, {user?.username.toUpperCase()}! 👋
              {/* YENİ: MOBİLDE DE GÖRÜNEN ANA RÜTBE ETİKETİ */}
              <span className={`text-xs ${userRank.bg} border ${userRank.border} ${userRank.color} px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm`}>
                {userRank.icon} {userRank.title}
              </span>
            </h2>
            <p className="text-gray-500 font-medium text-sm hidden md:block">Ekosistem bugün senin için neler hazırladı?</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="hidden md:block bg-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-all active:scale-95 uppercase">Yeni İlan</button>
        </header>

        {/* --- ARAMA MOTORU BAR --- */}
        <div className="mb-12">
          <div className="relative max-w-3xl">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kabile veya ilan ara..."
              className="w-full bg-gray-800/40 border border-gray-700/50 rounded-full pl-14 pr-12 py-5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-800/80 transition-all shadow-inner backdrop-blur-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-lg">✖</button>
            )}
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto custom-scrollbar pb-2 max-w-3xl">
            {["#Yazılım", "#Kimya", "#LGS", "#YKS", "#Girişim", "#Matematik"].map(tag => (
              <button 
                key={tag} 
                onClick={() => setSearchQuery(tag.replace("#", ""))} 
                className="bg-gray-800/40 border border-gray-700/50 hover:bg-gray-700 hover:border-gray-500 hover:text-blue-400 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          
          {/* Kabile Keşfi Bölümü */}
          <div className="xl:col-span-2 space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black tracking-tight italic">KABİLE KEŞFİ {searchQuery && <span className="text-blue-400 text-sm ml-2">({filteredHubs.length})</span>}</h3>
              <span className="h-[1px] flex-1 bg-gray-800 mx-6"></span>
            </div>
            
            {filteredHubs.length === 0 ? (
               <div className="bg-gray-800/20 border border-dashed border-gray-700 p-8 rounded-[2rem] text-center text-gray-500 font-medium text-sm">
                 Kabile bulunamadı.
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredHubs.map(hub => (
                  <div key={hub._id} className="bg-gray-800/30 border border-gray-700/50 p-7 rounded-[2.5rem] hover:border-gray-500 transition-all group relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">{hub.icon}</div>
                    <div className="flex justify-between mb-6 relative z-10">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{hub.icon}</span>
                      <span className="text-[9px] font-black bg-gray-700/50 px-3 py-1.5 rounded-full text-gray-400 uppercase tracking-widest border border-gray-700/20">{hub.category}</span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">{hub.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-6 line-clamp-2">{hub.description}</p>
                    <div className="mt-auto flex justify-between items-center relative z-10 pt-4 border-t border-gray-700/30">
                      <span className="text-[10px] text-gray-600 font-bold uppercase">{hub.members?.length} Üye</span>
                      {user?.hubs?.includes(hub._id) ? (
                        <Link href={`/hubs/${hub._id}`} className="bg-green-500/10 text-green-400 px-5 py-2.5 rounded-xl text-[9px] font-black border border-green-500/20 hover:bg-green-500/20 transition-all uppercase tracking-widest">Odaya Gir</Link>
                      ) : (
                        <button onClick={() => handleJoinHub(hub._id)} className="bg-blue-600 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 transition-all hover:bg-blue-500">Katıl</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* İlanlar Bölümü */}
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black tracking-tight italic">SON SİNERJİ {searchQuery && <span className="text-blue-400 text-sm ml-2">({filteredPosts.length})</span>}</h3>
              <span className="h-[1px] flex-1 bg-gray-800 ml-6"></span>
            </div>
            
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <div className="bg-gray-800/20 border border-dashed border-gray-700 p-8 rounded-[2rem] text-center text-gray-500 font-medium text-sm">
                  İlan bulunamadı.
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post._id} className="bg-gray-800/30 border border-gray-700 p-6 rounded-[2rem] flex flex-col group hover:bg-gray-800/50 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-blue-400 font-black text-[11px] uppercase tracking-tighter">@{post.username}</span>
                      <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-6 leading-relaxed font-medium">{post.content}</p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="text-[9px] font-black uppercase tracking-widest bg-gray-900 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-5 border-t border-gray-700/30">
                      <button onClick={() => handleUpvote(post._id)} className="flex-1 bg-gray-700/20 py-3 rounded-2xl text-[10px] font-black hover:bg-blue-600/20 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all">🙌 {post.upvotes?.length || 0}</button>
                      {post.user !== user?._id && (
                        <>
                          <button onClick={() => openChat(post.user, post.username)} className="bg-gray-700/20 px-4 py-3 rounded-2xl text-[10px] border border-transparent hover:border-gray-600 transition-all text-gray-400 hover:text-white">💬</button>
                          {!user?.friends?.includes(post.user) && (
                            <button onClick={() => handleSendFriendRequest(post.user)} className="bg-gray-700/20 px-4 py-3 rounded-2xl text-[10px] border border-transparent hover:border-blue-600/50 transition-all text-blue-500">➕</button>
                          )}
                        </>
                      )}
                    </div>
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