"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function DashboardPage() {
  const router = useRouter();
  const socket = useRef();

  // --- TEMEL DURUMLAR (STATES) ---
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  
  // --- BİLDİRİM VE ARKADAŞLIK DURUMLARI ---
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  
  // --- YORUM (YANKI) SİSTEMİ DURUMLARI ---
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [activeComments, setActiveComments] = useState({});
  const [commentInput, setCommentInput] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // --- MODAL DURUMLARI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // --- ARAMA VE ETİKET (HASHTAG) DURUMLARI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(null); 

  // --- HİKAYE (SİNYAL) SİSTEMİ DURUMLARI ---
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStory, setNewStory] = useState("");
  const [stories, setStories] = useState([]); // YENİ: Artık boş başlıyor, API'den dolacak!

  // --- ETKİNLİK SİSTEMİ VERİSİ ---
  const events = [
    { id: 1, title: 'Node.js Backend Kampı', time: 'Bugün 20:00', attendees: 12 },
    { id: 2, title: 'Gravimetrik Analiz Çözümleri', time: 'Yarın 15:00', attendees: 8 }
  ];

  // --- 1. SOCKET VE BİLDİRİM DİNLEYİCİSİ ---
  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getNotification", (data) => {
      toast(`🔔 ${data.message}`, {
        style: { borderRadius: '0.5rem', background: '#030027', color: '#F2F3D9', border: '1px solid #DE7A00', fontSize: '12px', fontWeight: 'bold' },
      });
      setNotifications(prev => [{ _id: Date.now(), message: data.message, isRead: false }, ...prev]);
    });

    socket.current.on("newCommentUpdate", (data) => {
        if (data.postId === openCommentsId) {
            fetchComments(data.postId);
        }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [openCommentsId]);

  // --- 2. VERİ ÇEKME MOTORU (BACKEND BAĞLANTILARI) ---
  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId || userId === "undefined") { router.push("/login"); return; }

      try {
        socket.current.emit("newUser", userId);

        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        const userData = await userRes.json();
        if (userRes.ok) { setUser(userData); } else { router.push("/login"); return; }

        const postsRes = await fetch("https://sinerjihub-1.onrender.com/api/posts/all");
        setPosts(await postsRes.json());

        const notifRes = await fetch(`https://sinerjihub-1.onrender.com/api/notifications/user/${userId}`);
        setNotifications(await notifRes.json());

        const friendRes = await fetch(`https://sinerjihub-1.onrender.com/api/social/requests/${userId}`);
        setFriendRequests(await friendRes.json());

        // YENİ: SİNYALLERİ (HİKAYELERİ) VERİTABANINDAN ÇEKİYORUZ
        const storiesRes = await fetch("https://sinerjihub-1.onrender.com/api/stories/active");
        if (storiesRes.ok) {
           setStories(await storiesRes.json());
        }

      } catch (error) { 
        console.error("Veri yüklenirken hata oluştu:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchData();
  }, [router]);

  // --- HİKAYE (SİNYAL) EKLEME MOTORU ---
  const handleAddStory = async (e) => {
    e.preventDefault();
    if(!newStory.trim()) return;
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/stories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: newStory }),
      });

      if (res.ok) {
        const savedStory = await res.json();
        setStories([savedStory, ...stories]);
        setNewStory("");
        setShowStoryModal(false);
        toast.success("Anlık Sinyal fırlatıldı! (24 Saat Aktif)", { style: { background: '#030027', color: '#F2F3D9', border: '1px solid #005700' } });
      }
    } catch (err) {
      toast.error("Bağlantı hatası, sinyal gitmedi!", { style: { background: '#520000', color: '#F2F3D9' } });
    }
  };

  const renderBadges = (roles) => {
    if (!roles || roles.length === 0) return null;
    return roles.map((role, idx) => {
      if (role === "Gezgin") return null; 
      let style = "bg-[#F2F3D9]/10 text-[#F2F3D9]/70 border-[#F2F3D9]/20";
      let icon = "•";
      
      if (role === "Kurucu") { style = "bg-[#520000] text-[#F2F3D9] border-[#520000]"; icon = "👑"; }
      if (role === "Moderatör") { style = "bg-[#005700] text-[#F2F3D9] border-[#005700]"; icon = "🛡️"; }
      if (role === "Gamer") { style = "bg-[#DE7A00]/20 text-[#DE7A00] border-[#DE7A00]/40"; icon = "🎮"; }
      if (role === "Kemik Tayfa") { style = "bg-[#F2F3D9] text-[#030027] border-[#F2F3D9]"; icon = "💎"; }
      
      return (
        <span key={idx} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${style} ml-2`}>
          {icon} {role}
        </span>
      );
    });
  };

  const fetchComments = async (postId) => {
    try {
        const res = await fetch(`https://sinerjihub-1.onrender.com/api/posts/${postId}/comments`);
        const data = await res.json();
        setActiveComments(prev => ({ ...prev, [postId]: data }));
    } catch (err) { console.error("Yorumlar yüklenemedi."); }
  };

  const toggleComments = (postId) => {
    if (openCommentsId === postId) {
        setOpenCommentsId(null);
    } else {
        setOpenCommentsId(postId);
        fetchComments(postId);
    }
  };

  const handleSendComment = async (postId) => {
    if (!commentInput.trim()) return;
    setIsCommenting(true);
    const userId = localStorage.getItem("userId");

    try {
        const res = await fetch(`https://sinerjihub-1.onrender.com/api/posts/${postId}/comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, content: commentInput }),
        });

        if (res.ok) {
            const savedComment = await res.json();
            setActiveComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), savedComment]
            }));
            setCommentInput("");
            setUser({ ...user, karmaPoints: (user.karmaPoints || 0) + 2 });
            toast.success("Yankı fırlatıldı! +2 Karma", { style: { background: '#005700', color: '#F2F3D9' } });
            socket.current.emit("newPostComment", { postId });
            
            const targetPost = posts.find(p => p._id === postId);
            if (targetPost && targetPost.user !== userId) {
              socket.current.emit("sendNotification", {
                senderId: userId,
                receiverId: targetPost.user,
                type: "comment",
                message: `@${user.username} sinerjine bir yankı bıraktı! 💬`
              });
            }
        }
    } catch (err) { alert("Yorum iletilemedi."); }
    setIsCommenting(false);
  };

  const handleSendFriendRequest = async (targetId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/request/${userId}/${targetId}`, { method: "POST" });
      const data = await res.json();
      toast.success(data.message, { style: { background: '#030027', color: '#F2F3D9', border: '1px solid #DE7A00' } });
    } catch (err) { alert("İstek gönderilemedi."); }
  };

  const handleAcceptFriend = async (friendId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/accept/${userId}/${friendId}`, { method: "POST" });
      if (res.ok) {
        toast.success("Artık arkadaşsınız! ✨", { style: { background: '#005700', color: '#F2F3D9' } });
        setFriendRequests(friendRequests.filter(req => req._id !== friendId));
        const updatedUser = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`).then(r => r.json());
        setUser(updatedUser);

        socket.current.emit("sendNotification", {
          senderId: userId,
          receiverId: friendId,
          type: "social",
          message: `@${user.username} ağ bağlama isteğini kabul etti! ✨`
        });
      }
    } catch (err) { alert("İstek kabul edilemedi."); }
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
        setUser({ ...user, karmaPoints: (user.karmaPoints || 0) + 5 });
        toast.success("İlan başarıyla yayınlandı! +5 Karma", { style: { background: '#005700', color: '#F2F3D9' } });
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
        const targetPost = posts.find(p => p._id === postId);
        if (targetPost && targetPost.user !== userId && !targetPost.upvotes?.includes(userId)) {
          socket.current.emit("sendNotification", {
            senderId: userId,
            receiverId: targetPost.user,
            type: "upvote",
            message: `@${user.username} ilanını destekledi! 🙌`
          });
        }
      }
    } catch (err) { console.error(err); }
  };

  const getTrendingTags = () => {
    const tagCounts = {};
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          const cleanTag = tag.toLowerCase().trim();
          tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
  };
  const trendingTags = getTrendingTags();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getKarmaRank = (karma) => {
    if (karma < 50) return { title: "Sinerji Çaylağı", icon: "🌱", color: "text-[#005700]", border: "border-[#005700]/30", bg: "bg-[#005700]/10" };
    if (karma < 150) return { title: "Ağ Gezgini", icon: "🌍", color: "text-[#DE7A00]", border: "border-[#DE7A00]/30", bg: "bg-[#DE7A00]/10" };
    if (karma < 500) return { title: "Sistem Katalizörü", icon: "⚡", color: "text-[#F2F3D9]", border: "border-[#F2F3D9]/30", bg: "bg-[#F2F3D9]/10" };
    return { title: "Ekosistem Lideri", icon: "👑", color: "text-[#520000]", border: "border-[#520000]/30", bg: "bg-[#520000]/10" };
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesTag = selectedTag ? (post.tags && post.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())) : true;
    return matchesSearch && matchesTag;
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#030027] flex items-center justify-center text-[#F2F3D9] flex-col">
      <div className="w-12 h-12 border-4 border-[#DE7A00] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Ağ Kuruluyor...</p>
    </div>
  );

  const totalNotifs = notifications.filter(n=>!n.isRead).length + friendRequests.length;
  const userRank = getKarmaRank(user?.karmaPoints || 0);

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans pb-20 md:pb-0 bg-[#030027] text-[#F2F3D9]">
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- SİNYAL (HİKAYE) EKLEME MODALI --- */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-[#030027]/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-[#02001a] border border-[#DE7A00]/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-[#F2F3D9]">Anlık Sinyal Fırlat</h3>
            <p className="text-[11px] text-[#F2F3D9]/60 mb-6">Sinyaller 24 saat sonra sistemden silinir.</p>
            <form onSubmit={handleAddStory} className="space-y-4">
              <input type="text" value={newStory} onChange={(e) => setNewStory(e.target.value)} className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl p-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors" placeholder="Neler oluyor?" required />
              <button className="w-full bg-[#DE7A00] py-3.5 rounded-xl font-bold text-sm text-[#030027] hover:bg-[#c26a00] transition-colors">YAYINLA</button>
              <button type="button" onClick={() => setShowStoryModal(false)} className="w-full text-[#F2F3D9]/50 text-xs font-bold mt-2 hover:text-[#F2F3D9]">Vazgeç</button>
            </form>
          </div>
        </div>
      )}

      {/* --- BİLDİRİM PANELİ --- */}
      {isNotifOpen && (
        <div className="fixed inset-0 bg-[#030027]/80 backdrop-blur-sm z-[80] flex justify-end">
          <div className="w-full md:w-80 bg-[#02001a] h-full p-6 border-l border-[#F2F3D9]/10 overflow-y-auto animate-in slide-in-from-right duration-300 custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-[#F2F3D9]/10 pb-4">
              <h3 className="font-bold text-lg text-[#F2F3D9]">Sinerji Akışı</h3>
              <button onClick={() => setIsNotifOpen(false)} className="text-2xl text-[#F2F3D9]/50 hover:text-[#DE7A00] transition-colors">&times;</button>
            </div>
            
            <div className="mb-8">
              <h4 className="text-xs font-bold text-[#DE7A00] uppercase tracking-wider mb-4">Ağ İstekleri</h4>
              {friendRequests.length === 0 ? <p className="text-[#F2F3D9]/50 text-xs">Bekleyen istek yok.</p> : friendRequests.map(req => (
                <div key={req._id} className="bg-[#030027] p-4 rounded-xl border border-[#DE7A00]/30 mb-3">
                  <p className="text-sm font-medium mb-3">{req.username} bağlantı kurmak istiyor.</p>
                  <button onClick={() => handleAcceptFriend(req._id)} className="w-full bg-[#DE7A00] text-[#030027] text-xs font-bold py-2.5 rounded-lg hover:bg-[#c26a00] transition-colors">KABUL ET</button>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#F2F3D9]/70 uppercase tracking-wider mb-4">Etkinlikler</h4>
              {notifications.length === 0 ? <p className="text-[#F2F3D9]/50 text-xs">Henüz bildirim yok.</p> : notifications.map(n => (
                <div key={n._id} className="bg-[#030027] border border-[#F2F3D9]/10 p-4 rounded-xl mb-2 text-xs text-[#F2F3D9]/80 leading-relaxed">
                  {n.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- İLAN AÇMA MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#030027]/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-[#02001a] border border-[#DE7A00]/30 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-[#F2F3D9]">Yeni İlan Yarat</h3>
            <p className="text-xs text-[#F2F3D9]/60 mb-6">Kod blokları için ``` kullanabilirsin.</p>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl p-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] h-32 resize-none transition-colors" placeholder="İçeriği buraya girin..." required />
              <input type="text" value={postTags} onChange={(e) => setPostTags(e.target.value)} className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl p-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors" placeholder="Etiketler (Yazılım, Kimya)" />
              <button disabled={isPosting} className="w-full bg-[#DE7A00] py-4 rounded-xl font-bold text-sm text-[#030027] hover:bg-[#c26a00] transition-colors mt-2">{isPosting ? "GÖNDERİLİYOR..." : "YAYINLA"}</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-[#F2F3D9]/50 text-xs font-bold mt-2 hover:text-[#F2F3D9] transition-colors">İptal Et</button>
            </form>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-[#02001a] border-r border-[#F2F3D9]/10 hidden md:flex flex-col p-8 h-screen sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#F2F3D9] mb-12 tracking-wide">
          SINERJI<span className="text-[#DE7A00]">HUB</span>
        </h1>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-4 bg-[#F2F3D9]/10 px-5 py-4 rounded-xl border border-[#F2F3D9]/20">
            <span className="text-lg">🏠</span> <span className="font-semibold text-sm text-[#F2F3D9]">Ana Üs</span>
          </Link>
          <Link href="/explore" className="flex items-center gap-4 text-[#F2F3D9]/60 hover:bg-[#F2F3D9]/5 px-5 py-4 rounded-xl transition-colors">
            <span className="text-lg">🧭</span> <span className="font-medium text-sm">Keşfet</span>
          </Link>
          <Link href="/messages" className="flex items-center gap-4 text-[#F2F3D9]/60 hover:bg-[#F2F3D9]/5 px-5 py-4 rounded-xl transition-colors">
            <span className="text-lg">💬</span> <span className="font-medium text-sm">Sinyaller</span>
          </Link>
          <button onClick={() => setIsNotifOpen(true)} className="w-full flex items-center gap-4 text-[#F2F3D9]/60 hover:bg-[#F2F3D9]/5 px-5 py-4 rounded-xl relative transition-colors">
            <span className="text-lg">🔔</span> <span className="font-medium text-sm">Akış</span>
            {totalNotifs > 0 && <span className="absolute right-4 bg-[#DE7A00] w-2 h-2 rounded-full"></span>}
          </button>
          <Link href="/profile" className="flex items-center gap-4 text-[#F2F3D9]/60 hover:bg-[#F2F3D9]/5 px-5 py-4 rounded-xl transition-colors">
            <span className="text-lg">👤</span> <span className="font-medium text-sm">Profil</span>
          </Link>
        </nav>
        
        <div className="mt-6 pt-6 border-t border-[#F2F3D9]/10 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-[#F2F3D9]/5 rounded-xl border border-[#F2F3D9]/10">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm bg-[#030027] border border-[#DE7A00]/50 overflow-hidden text-[#DE7A00]">
              {user?.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user?.username?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-[#F2F3D9]">{user?.username}</p>
              <p className="text-[10px] text-[#DE7A00] font-semibold mt-0.5">{user?.karmaPoints} Puan</p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("userId"); router.push("/login"); }} className="w-full text-[#520000] text-xs font-bold hover:text-[#F2F3D9] py-3 transition-colors">Oturumu Kapat</button>
        </div>
      </aside>

      {/* --- ANA AKIŞ --- */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
        <header className="flex justify-between items-start mb-10 border-b border-[#F2F3D9]/10 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-[#F2F3D9] mb-2">
              Hoş Geldin, {user?.username}.
            </h2>
            <p className="text-[#F2F3D9]/60 text-sm">Ağındaki son gelişmeler ve trendler.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="hidden md:block bg-[#DE7A00] px-6 py-3 rounded-xl font-bold text-sm text-[#030027] hover:bg-[#c26a00] transition-colors shadow-sm">İlan Oluştur</button>
        </header>

        {/* HİKAYELER / ANLIK SİNYALLER BÖLÜMÜ */}
        <div className="flex gap-6 overflow-x-auto pb-6 mb-8 custom-scrollbar items-center">
            <button onClick={() => setShowStoryModal(true)} className="flex flex-col items-center gap-2 flex-shrink-0 group">
               <div className="w-16 h-16 rounded-2xl bg-[#F2F3D9]/5 border border-dashed border-[#F2F3D9]/30 flex items-center justify-center text-2xl text-[#F2F3D9]/50 group-hover:border-[#DE7A00] group-hover:text-[#DE7A00] transition-colors">
                  +
               </div>
               <span className="text-[10px] font-semibold text-[#F2F3D9]/60 group-hover:text-[#F2F3D9] transition-colors">Sinyal Ekle</span>
            </button>

            {stories.map(story => (
               <div key={story._id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => toast(story.content, { icon: '💬', style: {background: '#030027', color: '#F2F3D9', border: '1px solid #DE7A00'} })}>
                  <div className="w-16 h-16 rounded-2xl bg-[#030027] border-2 border-[#DE7A00] flex items-center justify-center overflow-hidden font-bold text-xl text-[#F2F3D9]">
                     {story.user?.profilePicture ? <img src={story.user.profilePicture} className="w-full h-full object-cover"/> : story.user?.username?.[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] font-semibold text-[#F2F3D9]/80">{story.user?.username}</span>
               </div>
            ))}
        </div>

        {/* ARAMA BAR */}
        <div className="mb-10">
          <div className="relative max-w-3xl">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F2F3D9]/50 text-lg">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="İlanlarda ara..." className="w-full bg-[#F2F3D9]/5 border border-[#F2F3D9]/10 rounded-xl pl-12 pr-6 py-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* İLANLAR (POSTLAR) SOL KOLON */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-[#F2F3D9]">Sinerji Akışı</h3>
            </div>

            {selectedTag && (
              <div className="bg-[#DE7A00]/10 border border-[#DE7A00]/30 px-5 py-3 rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-[#F2F3D9]">
                  <span className="text-[#DE7A00] mr-2">#</span> 
                  Şu an <strong>{selectedTag}</strong> etiketini inceliyorsun.
                </span>
                <button onClick={() => setSelectedTag(null)} className="text-[10px] bg-[#030027] border border-[#F2F3D9]/20 text-[#F2F3D9] font-bold px-3 py-1.5 rounded-md hover:border-[#DE7A00] transition-colors">
                  Temizle
                </button>
              </div>
            )}
            
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-[#F2F3D9]/5 rounded-2xl border border-[#F2F3D9]/10">
                    <p className="text-[#F2F3D9]/50 text-sm">Kriterlere uygun ilan bulunamadı.</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post._id} className="bg-[#02001a] border border-[#F2F3D9]/10 p-6 rounded-2xl flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[#F2F3D9] font-bold text-sm">@{post.username}</span>
                        {renderBadges(post.roles || post.userRoles || [])}
                      </div>
                      <span className="text-xs text-[#F2F3D9]/40">{formatDate(post.createdAt)}</span>
                    </div>

                    <div className="text-sm text-[#F2F3D9]/90 mb-6 leading-relaxed">
                      <ReactMarkdown
                         components={{
                           code({node, inline, className, children, ...props}) {
                             return !inline ? (
                               <pre className="bg-[#030027] p-4 rounded-xl overflow-x-auto border border-[#F2F3D9]/10 my-4 text-xs text-[#F2F3D9] font-mono custom-scrollbar">
                                 <code className={className} {...props}>{children}</code>
                               </pre>
                             ) : (
                               <code className="bg-[#030027] border border-[#F2F3D9]/10 px-1.5 py-0.5 rounded text-[#DE7A00] font-mono text-xs" {...props}>{children}</code>
                             )
                           },
                           strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                           em: ({node, ...props}) => <em className="text-[#F2F3D9]/70 italic" {...props} />,
                         }}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </div>
                    
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map((tag, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setSelectedTag(tag)}
                            className="text-xs font-medium bg-[#F2F3D9]/5 text-[#F2F3D9]/70 border border-[#F2F3D9]/10 hover:border-[#DE7A00] hover:text-[#DE7A00] px-3 py-1 rounded-lg transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 mt-auto pt-4 border-t border-[#F2F3D9]/10">
                      <button onClick={() => handleUpvote(post._id)} className="flex-1 bg-[#F2F3D9]/5 py-2.5 rounded-xl text-xs font-bold text-[#F2F3D9] hover:bg-[#DE7A00] hover:text-[#030027] transition-colors border border-transparent">Destek ({post.upvotes?.length || 0})</button>
                      
                      <button onClick={() => toggleComments(post._id)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border ${openCommentsId === post._id ? "bg-[#DE7A00]/10 text-[#DE7A00] border-[#DE7A00]/30" : "bg-[#F2F3D9]/5 text-[#F2F3D9] border-transparent hover:bg-[#F2F3D9]/10"}`}>
                          Yankılar {activeComments[post._id]?.length > 0 && `(${activeComments[post._id].length})`}
                      </button>

                      {post.user !== user?._id && (
                        <>
                          <button onClick={() => router.push('/messages')} className="bg-[#F2F3D9]/5 px-4 py-2.5 rounded-xl text-xs text-[#F2F3D9] hover:bg-[#F2F3D9]/10 transition-colors">✉️</button>
                          {!user?.friends?.includes(post.user) && (
                            <button onClick={() => handleSendFriendRequest(post.user)} className="bg-[#F2F3D9]/5 px-4 py-2.5 rounded-xl text-xs text-[#F2F3D9] hover:bg-[#F2F3D9]/10 transition-colors">➕</button>
                          )}
                        </>
                      )}
                    </div>

                    {openCommentsId === post._id && (
                      <div className="mt-6 pt-6 border-t border-[#F2F3D9]/10">
                          <div className="space-y-4 mb-6">
                              {activeComments[post._id]?.length === 0 ? (
                                  <p className="text-xs text-[#F2F3D9]/40 text-center">Bu ilana henüz yankı gelmedi.</p>
                              ) : (
                                  activeComments[post._id]?.map(comm => (
                                      <div key={comm._id} className="bg-[#030027] border border-[#F2F3D9]/5 p-4 rounded-xl">
                                          <div className="flex justify-between mb-2">
                                              <span className="text-xs font-bold text-[#DE7A00]">{comm.username}</span>
                                              <span className="text-[10px] text-[#F2F3D9]/40">{formatDate(comm.createdAt)}</span>
                                          </div>
                                          <div className="text-xs text-[#F2F3D9]/80 leading-relaxed">
                                            <ReactMarkdown
                                               components={{
                                                 code({node, inline, className, children, ...props}) {
                                                   return !inline ? (
                                                     <pre className="bg-[#02001a] p-3 rounded-lg border border-[#F2F3D9]/10 my-2 text-xs text-[#F2F3D9] font-mono overflow-x-auto"><code {...props}>{children}</code></pre>
                                                   ) : (
                                                     <code className="bg-[#02001a] px-1 py-0.5 rounded text-[#DE7A00] font-mono text-[10px]" {...props}>{children}</code>
                                                   )
                                                 }
                                               }}
                                            >
                                              {comm.content}
                                            </ReactMarkdown>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                          <div className="flex gap-2">
                              <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Yankı ekle..." className="flex-1 bg-[#030027] border border-[#F2F3D9]/10 rounded-xl px-4 py-2.5 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors" />
                              <button onClick={() => handleSendComment(post._id)} disabled={isCommenting || !commentInput.trim()} className="bg-[#DE7A00] text-[#030027] hover:bg-[#c26a00] px-5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                                  GÖNDER
                              </button>
                          </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SAĞ KOLON: TRENDLER VE ETKİNLİKLER */}
          <div className="space-y-6">
            
            <div className="bg-[#02001a] border border-[#F2F3D9]/10 p-6 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-[#F2F3D9]">Popüler Konular</h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length === 0 ? (
                  <p className="text-xs text-[#F2F3D9]/50">Henüz trend yok.</p>
                ) : (
                  trendingTags.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedTag(item.tag)}
                      className="bg-[#F2F3D9]/5 border border-[#F2F3D9]/10 hover:border-[#DE7A00] text-[#F2F3D9]/80 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
                    >
                      {item.tag} <span className="text-[#DE7A00] text-[10px]">{item.count}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#02001a] border border-[#F2F3D9]/10 p-6 rounded-2xl">
                <h3 className="text-sm font-bold mb-4 text-[#F2F3D9]">Yaklaşan Etkinlikler</h3>
                <div className="space-y-3">
                    {events.map(ev => (
                        <div key={ev.id} className="bg-[#030027] p-4 rounded-xl border border-[#F2F3D9]/5 flex flex-col gap-2 hover:border-[#DE7A00]/50 transition-colors cursor-pointer">
                            <h4 className="text-sm font-bold text-[#F2F3D9]">{ev.title}</h4>
                            <div className="flex justify-between items-center text-xs text-[#F2F3D9]/50">
                                <span>{ev.time}</span>
                                <span className="bg-[#F2F3D9]/5 px-2 py-1 rounded text-[10px]">{ev.attendees} Kişi</span>
                            </div>
                        </div>
                    ))}
                    <button className="w-full mt-2 bg-[#F2F3D9]/5 text-[#F2F3D9] hover:bg-[#F2F3D9]/10 py-2.5 rounded-xl text-xs font-bold transition-colors">
                        Tümünü Gör
                    </button>
                </div>
            </div>

            <div className="bg-[#030027] border border-[#DE7A00]/30 p-6 rounded-2xl text-center">
               <h3 className="text-base font-bold text-[#F2F3D9] mb-2">Sinerji Ağı Genişliyor</h3>
               <p className="text-xs text-[#F2F3D9]/60 mb-5">Yeni kabileler ve gezginlerle eşleşmek için Keşfet'e göz at.</p>
               <Link href="/explore" className="inline-block w-full bg-[#DE7A00] hover:bg-[#c26a00] text-[#030027] font-bold text-xs px-5 py-3 rounded-xl transition-colors">
                  Keşfet'e Git
               </Link>
            </div>

          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F2F3D930; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #DE7A00; }
      `}</style>
    </div>
  );
}