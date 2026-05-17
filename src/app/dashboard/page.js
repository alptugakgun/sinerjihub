"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";

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
  const [recommendations, setRecommendations] = useState([]);
  
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

  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [hubForm, setHubForm] = useState({ name: "", category: "", description: "", icon: "🔥", isPrivate: false, passcode: "" });
  const [isCreatingHub, setIsCreatingHub] = useState(false);

  // --- DM (BİREBİR MESAJLAŞMA) DURUMLARI ---
  const [isDmOpen, setIsDmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [newDm, setNewDm] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);

  // --- YENİ EKLENEN: ARAMA VE ETİKET (HASHTAG) DURUMLARI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(null); // Tıklanan aktif hashtag

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getDm", (data) => {
      setArrivalMessage({
        sender: data.sender,
        content: data.content,
        createdAt: Date.now(),
      });
      toast('Sinyal: Yeni bir DM aldın! 💬', {
        style: { borderRadius: '1rem', background: '#1f2937', color: '#fff', border: '1px solid #374151', fontSize: '12px', fontWeight: 'bold' },
      });
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

  useEffect(() => {
    if (arrivalMessage && selectedUser && arrivalMessage.sender === selectedUser._id) {
      setDmMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, selectedUser]);

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

        const hubsRes = await fetch("https://sinerjihub-1.onrender.com/api/hubs/all");
        setHubs(await hubsRes.json());

        const notifRes = await fetch(`https://sinerjihub-1.onrender.com/api/notifications/user/${userId}`);
        setNotifications(await notifRes.json());

        const friendRes = await fetch(`https://sinerjihub-1.onrender.com/api/social/requests/${userId}`);
        setFriendRequests(await friendRes.json());

        const recRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/recommendations/${userId}`);
        setRecommendations(await recRes.json());

      } catch (error) { 
        console.error("Veri yüklenirken hata oluştu:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchData();
  }, [router]);

  // --- KABİLE KURMA FONKSİYONU ---
  const handleCreateHub = async (e) => {
    e.preventDefault();
    if (user?.karmaPoints < 50) {
      toast.error("Bunun için en az 50 Karma (Ağ Gezgini) olmalısın!", { style: { background: '#7f1d1d', color: '#fff' } });
      return;
    }
    
    setIsCreatingHub(true);
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/hubs/create", {
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

  // --- YORUM (YANKI) FONKSİYONLARI ---
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
            toast.success("Yankı fırlatıldı! +2 Karma", { style: { background: '#1f2937', color: '#fff' } });
            socket.current.emit("newPostComment", { postId });
        }
    } catch (err) { alert("Yorum iletilemedi."); }
    setIsCommenting(false);
  };

  // --- SOSYAL VE DM FONKSİYONLARI ---
  const handleSendFriendRequest = async (targetId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/request/${userId}/${targetId}`, { method: "POST" });
      const data = await res.json();
      toast.success(data.message, { style: { background: '#1f2937', color: '#fff' } });
      setRecommendations(recommendations.filter(rec => rec._id !== targetId));
    } catch (err) { alert("İstek gönderilemedi."); }
  };

  const handleAcceptFriend = async (friendId) => {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/social/accept/${userId}/${friendId}`, { method: "POST" });
      if (res.ok) {
        toast.success("Artık arkadaşsınız! ✨", { style: { background: '#1f2937', color: '#fff' } });
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
    socket.current.emit("sendDm", { senderId: userId, receiverId: selectedUser._id, content: newDm });
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

  // --- İLAN FONKSİYONLARI ---
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
        toast.success("İlan başarıyla yayınlandı! +5 Karma", { style: { background: '#1f2937', color: '#fff' } });
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
        toast.success("Kabileye başarıyla katıldın!", { style: { background: '#1f2937', color: '#fff' } });
        setUser({ ...user, hubs: [...(user.hubs || []), hubId], karmaPoints: (user.karmaPoints || 0) + 10 });
      } else {
          const data = await res.json();
          toast.error(data.message, { style: { background: '#7f1d1d', color: '#fff' } });
      }
    } catch (err) { console.error(err); }
  };

  // --- YENİ EKLENEN: DİNAMİK TREND ALGORİTMASI ---
  // Sistemdeki tüm postları tarayıp en çok geçen 5 etiketi (hashtag'i) sayar
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
    // Sayıya göre büyükten küçüğe sırala ve ilk 5'i al
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  };
  const trendingTags = getTrendingTags();

  // --- YARDIMCI VE FİLTRELEME FONKSİYONLARI ---
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getKarmaRank = (karma) => {
    if (karma < 50) return { title: "Sinerji Çaylağı", icon: "🌱", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" };
    if (karma < 150) return { title: "Ağ Gezgini", icon: "🌍", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" };
    if (karma < 500) return { title: "Sistem Katalizörü", icon: "⚡", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" };
    return { title: "Ekosistem Lideri", icon: "👑", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" };
  };

  const filteredHubs = hubs.filter(hub => 
    hub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    hub.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // YENİ: İlanlar artık hem arama çubuğuna hem de tıklanan hashtag'e (selectedTag) göre filtreleniyor
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesTag = selectedTag ? (post.tags && post.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())) : true;
    
    return matchesSearch && matchesTag;
  });

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
      
      <Toaster position="top-center" reverseOrder={false} />

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
            <input type="text" value={newDm} onChange={(e) => setNewDm(e.target.value)} placeholder="Mesaj yaz..." className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-xs outline-none focus:border-blue-500 transition-all shadow-inner" autoComplete="off" />
          </form>
        </div>
      )}

      {/* --- BİLDİRİM PANELİ --- */}
      {isNotifOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex justify-end">
          <div className="w-full md:w-80 bg-gray-800 h-full p-6 border-l border-gray-700 overflow-y-auto animate-in slide-in-from-right duration-300 custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-lg tracking-tighter italic text-white">SİNERJİ AKIŞI</h3>
              <button onClick={() => setIsNotifOpen(false)} className="text-2xl text-gray-500 hover:text-white transition-colors">&times;</button>
            </div>
            
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Yeni İstekler</h4>
              {friendRequests.length === 0 ? <p className="text-gray-600 text-[10px] font-medium uppercase">Bekleyen istek yok.</p> : friendRequests.map(req => (
                <div key={req._id} className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 mb-3">
                  <p className="text-[11px] font-bold mb-3">{req.username.toUpperCase()} Seninle bağ kurmak istiyor.</p>
                  <button onClick={() => handleAcceptFriend(req._id)} className="w-full bg-blue-600 text-[10px] font-black py-2 rounded-lg hover:bg-blue-500 transition-all">KABUL ET</button>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Son Etkinlikler</h4>
              {notifications.length === 0 ? <p className="text-gray-600 text-[10px] font-medium uppercase">Henüz bildirim yok.</p> : notifications.map(n => (
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
            <h3 className="text-2xl font-black mb-6 tracking-tight text-white">Yeni İlan Çağrısı 🚀</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500 h-32 resize-none" placeholder="Ne arıyorsun? Bir çalışma ortağı mı?" required />
              <input type="text" value={postTags} onChange={(e) => setPostTags(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500" placeholder="Etiketler (örneğin: Kimya, Yazılım)" />
              <button disabled={isPosting} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">{isPosting ? "GÖNDERİLİYOR..." : "YAYINLA"}</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-gray-300">Vazgeç</button>
            </form>
          </div>
        </div>
      )}

      {/* --- KABİLE KURMA MODALI --- */}
      {isHubModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-indigo-500/30 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            <h3 className="text-2xl font-black mb-6 tracking-tight text-white flex items-center gap-2">
              Kendi Kabileni İnşa Et 👑
            </h3>
            <form onSubmit={handleCreateHub} className="space-y-4 relative z-10">
              <div className="flex gap-4">
                <input type="text" required value={hubForm.icon} onChange={(e) => setHubForm({...hubForm, icon: e.target.value})} className="w-16 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center text-2xl text-white outline-none focus:border-indigo-500" placeholder="🔥" />
                <input type="text" required value={hubForm.name} onChange={(e) => setHubForm({...hubForm, name: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500" placeholder="Kabile Adı (Örn: LGS Çalışma Kampı)" />
              </div>
              <input type="text" required value={hubForm.category} onChange={(e) => setHubForm({...hubForm, category: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500" placeholder="Kategori (Örn: Kimya, Yazılım)" />
              <textarea required value={hubForm.description} onChange={(e) => setHubForm({...hubForm, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-500 h-24 resize-none" placeholder="Bu odanın amacı nedir?" />
              
              <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                <input type="checkbox" id="isPrivate" checked={hubForm.isPrivate} onChange={(e) => setHubForm({...hubForm, isPrivate: e.target.checked})} className="w-4 h-4 accent-indigo-500" />
                <label htmlFor="isPrivate" className="text-sm font-bold text-gray-300 cursor-pointer">Bu kabile şifreli ve özel olsun 🔒</label>
              </div>

              {hubForm.isPrivate && (
                <input type="text" required value={hubForm.passcode} onChange={(e) => setHubForm({...hubForm, passcode: e.target.value})} className="w-full bg-indigo-900/20 border border-indigo-500/50 rounded-2xl p-4 text-sm text-indigo-300 outline-none focus:border-indigo-400 placeholder-indigo-500/50 font-mono tracking-widest" placeholder="Giriş Şifresi Belirle" />
              )}

              <button disabled={isCreatingHub} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-sm text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 mt-2">{isCreatingHub ? "İNŞA EDİLİYOR..." : "KABİLEYİ YARAT"}</button>
              <button type="button" onClick={() => setIsHubModalOpen(false)} className="w-full text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-gray-300">Vazgeç</button>
            </form>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-gray-800/40 border-r border-gray-700/50 hidden md:flex flex-col p-8 backdrop-blur-2xl h-screen sticky top-0 z-10">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-12 tracking-tighter italic">SINERJIHUB</h1>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-4 bg-blue-600/10 px-5 py-4 rounded-2xl border border-blue-500/20 group">
            <span className="text-xl">🏠</span> <span className="font-bold text-sm text-white">Ana Üs</span>
          </Link>
          <button onClick={() => setIsNotifOpen(true)} className="w-full flex items-center gap-4 text-gray-400 hover:bg-gray-700/30 px-5 py-4 rounded-2xl relative transition-all group">
            <span className="text-xl group-hover:scale-110">🔔</span> <span className="font-medium text-sm">Akış</span>
            {totalNotifs > 0 && <span className="absolute right-4 bg-red-500 w-2 h-2 rounded-full animate-ping"></span>}
          </button>
          <Link href="/profile" className="flex items-center gap-4 text-gray-400 hover:bg-gray-700/30 px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:rotate-12">👤</span> <span className="font-medium text-sm">Profil</span>
          </Link>
        </nav>
        
        <div className="mt-auto pt-8 border-t border-gray-700/50 flex flex-col gap-4">
          <div className={`flex items-center gap-2 ${userRank.bg} border ${userRank.border} p-3 rounded-2xl justify-center shadow-inner`}>
            <span className="text-lg">{userRank.icon}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${userRank.color}`}>{userRank.title}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-2xl border border-gray-700/50">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white/10 overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600">
              {user?.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user?.username?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-black truncate text-gray-200">{user?.username.toUpperCase()}</p>
              <p className="text-[9px] text-blue-400 font-black tracking-tighter">{user?.karmaPoints} KARMA</p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("userId"); router.push("/login"); }} className="w-full text-red-500/70 text-[10px] font-black uppercase tracking-widest hover:text-red-400 py-3 transition-all">Sistemden Çık</button>
        </div>
      </aside>

      {/* --- ANA AKIŞ --- */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-grid-slate-900/[0.04]">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 italic text-white uppercase">
              HOŞ GELDİN, {user?.username}! 👋
            </h2>
            <p className="text-gray-500 font-medium text-sm">Ekosistem bugün senin için neler hazırladı?</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="hidden md:block bg-blue-600 px-8 py-3.5 rounded-2xl font-black text-xs text-white tracking-widest shadow-xl hover:-translate-y-1 transition-all uppercase">Yeni İlan</button>
        </header>

        {/* ARAMA BAR */}
        <div className="mb-8">
          <div className="relative max-w-3xl">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-xl">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Kabile veya ilan ara..." className="w-full bg-gray-800/40 border border-gray-700/50 rounded-full pl-14 pr-12 py-5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-800/80 transition-all shadow-inner backdrop-blur-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* İLANLAR (POSTLAR) SOL KOLON */}
          <div className="xl:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tight italic text-white flex items-center gap-3">
                 SİNERJİ AKIŞI <span className="h-[1px] flex-1 bg-gray-800"></span>
              </h3>
            </div>

            {/* YENİ EKLENEN: AKTİF ETİKET FİLTRESİ UYARISI */}
            {selectedTag && (
              <div className="bg-blue-600/20 border border-blue-500/50 px-6 py-4 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-bold text-blue-300">
                  <span className="text-blue-500 mr-2">📌</span> 
                  Şu an <strong className="text-white uppercase">#{selectedTag}</strong> sinerjilerini inceliyorsun.
                </span>
                <button onClick={() => setSelectedTag(null)} className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                  Filtreyi Temizle
                </button>
              </div>
            )}
            
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-10 bg-gray-800/20 rounded-[2rem] border border-gray-800">
                    <p className="text-gray-500 font-medium">Bu kriterlere uygun bir sinerji bulunamadı.</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post._id} className="bg-gray-800/30 border border-gray-700 p-6 rounded-[2rem] flex flex-col group hover:bg-gray-800/50 transition-all shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-blue-400 font-black text-[11px] uppercase tracking-tighter">@{post.username}</span>
                      <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-6 leading-relaxed font-medium">{post.content}</p>
                    
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {/* YENİ EKLENEN: ETİKETLER ARTIK TIKLANABİLİR BİRER BUTON */}
                        {post.tags.map((tag, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setSelectedTag(tag)}
                            className="text-[9px] font-black uppercase tracking-widest bg-gray-900 text-gray-400 border border-gray-700 hover:border-blue-500/50 hover:text-blue-300 px-3 py-1.5 rounded-lg transition-all"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-5 border-t border-gray-700/30">
                      <button onClick={() => handleUpvote(post._id)} className="flex-1 bg-gray-700/20 py-3 rounded-2xl text-[10px] font-black hover:bg-blue-600/20 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all">🙌 {post.upvotes?.length || 0}</button>
                      
                      {/* YANKI BUTONU */}
                      <button onClick={() => toggleComments(post._id)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all border border-transparent ${openCommentsId === post._id ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" : "bg-gray-700/20 text-gray-400 hover:text-white"}`}>
                          💬 YANKILAR {activeComments[post._id]?.length > 0 && `(${activeComments[post._id].length})`}
                      </button>

                      {post.user !== user?._id && (
                        <>
                          <button onClick={() => openChat(post.user, post.username)} className="bg-gray-700/20 px-4 py-3 rounded-2xl text-[10px] text-gray-400 hover:text-white">✉️</button>
                          {!user?.friends?.includes(post.user) && (
                            <button onClick={() => handleSendFriendRequest(post.user)} className="bg-gray-700/20 px-4 py-3 rounded-2xl text-[10px] text-blue-500">➕</button>
                          )}
                        </>
                      )}
                    </div>

                    {/* YANKI (YORUM) PANELİ */}
                    {openCommentsId === post._id && (
                      <div className="mt-6 pt-6 border-t border-gray-700/50 animate-in slide-in-from-top duration-300">
                          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                              {activeComments[post._id]?.length === 0 ? (
                                  <p className="text-[10px] text-gray-600 font-bold uppercase text-center italic">Bu ilana henüz yankı gelmedi. İlkini sen yap!</p>
                              ) : (
                                  activeComments[post._id]?.map(comm => (
                                      <div key={comm._id} className="bg-gray-900/40 border border-gray-800 p-4 rounded-2xl">
                                          <div className="flex justify-between mb-2">
                                              <span className="text-[10px] font-black text-indigo-400 uppercase">@{comm.username}</span>
                                              <span className="text-[9px] text-gray-600 font-bold">{formatDate(comm.createdAt)}</span>
                                          </div>
                                          <p className="text-xs text-gray-300 font-medium leading-relaxed">{comm.content}</p>
                                      </div>
                                  ))
                              )}
                          </div>
                          {/* YORUM GİRİŞ ALANI */}
                          <div className="flex gap-2">
                              <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Yankını fırlat..." className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
                              <button onClick={() => handleSendComment(post._id)} disabled={isCommenting || !commentInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50">
                                  {isCommenting ? "..." : "YANKILA"}
                              </button>
                          </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SAĞ KOLON: TRENDLER, RADAR VE KABİLELER */}
          <div className="space-y-8">
            
            {/* YENİ EKLENEN: TREND GÜNDEM PANELİ */}
            <div className="bg-gray-800/30 border border-gray-700/50 p-6 rounded-[2rem] relative overflow-hidden">
              <h3 className="text-sm font-black tracking-widest uppercase mb-5 text-blue-400 italic flex items-center gap-2">
                <span>🔥</span> Trend Gündem
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length === 0 ? (
                  <p className="text-[10px] text-gray-600 font-bold uppercase">Henüz trend yok.</p>
                ) : (
                  trendingTags.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedTag(item.tag)}
                      className="bg-gray-900 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                    >
                      #{item.tag} <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded text-[8px]">{item.count}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

             {/* SİNERJİ RADARI */}
             <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/10 border border-indigo-500/30 p-6 rounded-[2rem] relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-20">📡</div>
                <h3 className="text-sm font-black tracking-widest uppercase mb-4 text-indigo-400 italic">Sinerji Radarı</h3>
                <div className="space-y-3">
                    {recommendations.length === 0 ? <p className="text-[10px] text-gray-600 font-bold uppercase">Şu an eşleşme yok.</p> : recommendations.map(rec => (
                        <div key={rec._id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition-all">
                           <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                                    {rec.profilePicture ? <img src={rec.profilePicture} className="w-full h-full object-cover"/> : rec.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-200">{rec.username}</p>
                                    <p className="text-[9px] text-indigo-400 font-black">{rec.karmaPoints} KARMA</p>
                                </div>
                           </div>
                           <button onClick={() => handleSendFriendRequest(rec._id)} className="text-[9px] bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-xl font-black transition-all">BAĞ KUR</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* KABİLELER */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black tracking-tight italic text-white flex items-center gap-3">
                   KABİLE KEŞFİ
                </h3>
                {/* KABİLE KURMA BUTONU */}
                <button onClick={() => setIsHubModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-[9px] font-black uppercase tracking-widest text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                    + KABİLE KUR
                </button>
            </div>
            
            <div className="space-y-4">
                {filteredHubs.map(hub => (
                    <div key={hub._id} className="bg-gray-800/30 border border-gray-700 p-5 rounded-[2rem] hover:border-gray-500 transition-all group">
                        <div className="flex justify-between mb-4">
                            <span className="text-4xl group-hover:scale-110 transition-transform">{hub.icon}</span>
                            <span className="text-[9px] font-black bg-gray-700/50 px-3 py-1.5 rounded-full text-gray-400 uppercase tracking-widest">{hub.category}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-1 text-white flex items-center gap-2">
                            {hub.name} {hub.isPrivate && "🔒"}
                        </h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed mb-4 line-clamp-2">{hub.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-gray-600 font-black uppercase">{hub.members?.length} Üye</span>
                            {user?.hubs?.includes(hub._id) ? (
                                <Link href={`/hubs/${hub._id}`} className="bg-green-500/10 text-green-400 px-4 py-2 rounded-xl text-[9px] font-black border border-green-500/20">ODAYA GİR</Link>
                            ) : (
                                <button onClick={() => handleJoinHub(hub._id)} className="bg-blue-600 px-4 py-2 rounded-xl text-[9px] font-black text-white hover:bg-blue-500">KATIL</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}