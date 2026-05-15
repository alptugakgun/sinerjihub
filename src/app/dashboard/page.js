"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [hubs, setHubs] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        // 1. Kullanıcı verisini çek
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else {
          localStorage.removeItem("userId");
          router.push("/login");
          return;
        }

        // 2. İlanları çek
        const postsRes = await fetch("https://sinerjihub-1.onrender.com/api/posts/all");
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }

        // 3. Kabileleri çek
        const hubsRes = await fetch("https://sinerjihub-1.onrender.com/api/hubs/all");
        if (hubsRes.ok) {
          const hubsData = await hubsRes.json();
          setHubs(hubsData);
        }

      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
        setPostContent(""); 
        setPostTags(""); 
        setIsModalOpen(false);
      } else {
        alert("İlan paylaşılamadı.");
      }
    } catch (err) { alert("Bağlantı hatası."); }
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
    } catch (err) { console.error("Upvote hatası:", err); }
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
        alert("Kabileye başarıyla katıldın! 🎉");
        setUser({ ...user, hubs: [...(user.hubs || []), hubId] });
      }
    } catch (err) { alert("Bağlantı hatası."); }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium text-gray-400">SinerjiHub Ekosistemi Hazırlanıyor...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex relative font-sans selection:bg-blue-500/30">
      
      {/* İLAN MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gray-800 border border-gray-700 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Yeni İlan Aç 🚀</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-5">
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-2xl px-5 py-4 text-white focus:border-blue-500 h-32 resize-none transition-all outline-none" placeholder="Ne arıyorsun? Eğitim ortağı, proje arkadaşı veya sadece bir soru..." required></textarea>
              <input type="text" value={postTags} onChange={(e) => setPostTags(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-2xl px-5 py-4 text-white focus:border-blue-500 transition-all outline-none" placeholder="Etiketler (Örn: Yazılım, Kimya, LGS)" />
              <button type="submit" disabled={isPosting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50">
                {isPosting ? "Kabileye Duyuruluyor..." : "İlanı Yayınla"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SİDEBAR */}
      <aside className="w-72 bg-gray-800/40 border-r border-gray-700/50 hidden md:flex flex-col p-8 backdrop-blur-2xl h-screen sticky top-0">
        <div className="mb-12">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
            SinerjiHub
          </h1>
        </div>
        
        <nav className="flex-1 space-y-3">
          <Link href="/dashboard" className="flex items-center gap-4 text-white bg-blue-600/10 px-5 py-4 rounded-2xl border border-blue-500/20 group transition-all shadow-sm">
            <span className="text-xl">🏠</span> <span className="font-semibold">Ana Üs</span>
          </Link>
          <Link href="#" className="flex items-center gap-4 text-gray-400 hover:text-white hover:bg-gray-700/30 px-5 py-4 rounded-2xl transition-all">
            <span className="text-xl">🔥</span> <span className="font-medium">Kabilelerim</span>
          </Link>
          <Link href="#" className="flex items-center gap-4 text-gray-400 hover:text-white hover:bg-gray-700/30 px-5 py-4 rounded-2xl transition-all">
            <span className="text-xl">💬</span> <span className="font-medium">Mesajlar</span>
          </Link>
          <Link href="#" className="flex items-center gap-4 text-gray-400 hover:text-white hover:bg-gray-700/30 px-5 py-4 rounded-2xl transition-all">
            <span className="text-xl">🎯</span> <span className="font-medium">Odalarım</span>
          </Link>
        </nav>

        <div className="mt-auto space-y-6 border-t border-gray-700/50 pt-8">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 px-5 py-4 rounded-2xl transition-all text-sm font-bold group">
            <span className="group-hover:translate-x-1 transition-transform">🚪</span> Çıkış Yap
          </button>
          
          <Link href="/profile" className="block group">
            <div className="flex items-center gap-4 p-3 rounded-2xl group-hover:bg-gray-700/30 transition-all border border-transparent group-hover:border-gray-700/50">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-lg shadow-xl ring-2 ring-blue-500/20">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{user?.username || "Gezgin"}</p>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{user?.karmaPoints || 0} KARMA 🌟</p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-gray-900">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2">Hoş Geldin, {user?.username || "Dostum"}!</h2>
            <p className="text-gray-400 font-medium text-lg">Ekosistemin nabzını buradan tutabilirsin.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-bold transition-all shadow-xl shadow-blue-900/20 hover:-translate-y-1 active:translate-y-0">
            + Yeni İlan Aç
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          
          {/* KABİLELER BÖLÜMÜ */}
          <div className="xl:col-span-2 space-y-10">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-2xl font-bold tracking-tight">Kabile Keşfi</h3>
              <Link href="#" className="text-sm font-bold text-blue-400 hover:text-blue-300">Tümünü Gör</Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hubs.map((hub) => {
                const isMember = user?.hubs?.includes(hub._id);
                return (
                  <div key={hub._id} className="bg-gray-800/40 border border-gray-700/50 p-7 rounded-[2.5rem] transition-all hover:bg-gray-800/60 hover:border-gray-600 flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-6">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{hub.icon}</span>
                      <span className="text-[10px] font-black bg-gray-700/50 px-3 py-1.5 rounded-full text-gray-400 uppercase tracking-widest border border-gray-700/30">
                        {hub.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-xl mb-2">{hub.name}</h4>
                    <p className="text-sm text-gray-400 mb-8 line-clamp-2 font-medium leading-relaxed">{hub.description}</p>
                    
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-700/40">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800"></div>)}
                        <span className="ml-4 text-xs text-gray-500 font-bold self-center">{hub.members?.length || 0} Üye</span>
                      </div>
                      
                      {isMember ? (
                        <Link 
                          href={`/hubs/${hub._id}`}
                          className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-green-500/20 transition-all"
                        >
                          ODAYA GİR 🚪
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleJoinHub(hub._id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg shadow-blue-900/10"
                        >
                          KATIL
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* İLANLAR AKIŞI */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold px-2 tracking-tight">Canlı Sinerji</h3>
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-gray-800/20 border border-dashed border-gray-700 p-12 rounded-[2rem] text-center">
                  <p className="text-gray-500 font-bold">Ekosistem şu an sakin.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="bg-gray-800/30 border border-gray-700/40 p-6 rounded-[2rem] transition-all hover:bg-gray-800/50 flex flex-col group">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-blue-400 text-sm tracking-tight">{post.username}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-6 leading-relaxed font-medium">
                      {post.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.tags?.map((tag, index) => (
                        <span key={index} className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-2 py-1 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-5 border-t border-gray-700/30 flex items-center gap-3">
                      <button 
                        onClick={() => handleUpvote(post._id)}
                        disabled={post.upvotes?.includes(user?._id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black transition-all border ${post.upvotes?.includes(user?._id) ? "bg-blue-500/10 text-blue-400 border-blue-500/20 cursor-default" : "bg-gray-700/30 text-gray-300 border-gray-700/50 hover:bg-blue-600 hover:text-white hover:border-blue-500"}`}
                      >
                        {post.upvotes?.includes(user?._id) ? "DESTEKLENDİ" : "DESTEKLE"}
                        <span className="bg-black/30 px-2 py-1 rounded-md min-w-[20px]">{post.upvotes?.length || 0}</span>
                      </button>
                      <button className="px-4 py-3 rounded-2xl border border-gray-700/50 bg-gray-700/20 text-gray-400 hover:text-white transition-all">
                        💬
                      </button>
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