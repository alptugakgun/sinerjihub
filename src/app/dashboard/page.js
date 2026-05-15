"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [posts, setPosts] = useState([]);
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
        // Kullanıcı verisini canlı sunucudan çek
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else {
          localStorage.removeItem("userId");
          router.push("/login");
          return;
        }

        // Tüm ilanları canlı sunucudan çek
        const postsRes = await fetch("https://sinerjihub-1.onrender.com/api/posts/all");
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }

      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // İlan Gönderme Motoru
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
        alert("İlan paylaşılamadı, bir sorun oluştu.");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
    }
    setIsPosting(false);
  };

  // YENİ: Çıkış Yapma Motoru
  const handleLogout = () => {
    localStorage.removeItem("userId"); // Kimliği hafızadan sil
    router.push("/login"); // Giriş sayfasına fırlat
  };

  const recommendedHubs = [
    { id: 1, name: "YBS Geliştiricileri", members: 342, category: "Yazılım & Yönetim", icon: "💻" },
    { id: 2, name: "Organik Kimya Lab", members: 128, category: "Eğitim", icon: "🧪" },
    { id: 3, name: "GTA 5 RP Sunucusu", members: 856, category: "Oyun", icon: "🎮" },
    { id: 4, name: "Next.js & React", members: 512, category: "Yazılım", icon: "⚛️" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium text-gray-400">SinerjiHub Ekosistemi Yükleniyor...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex relative">
      
      {/* İLAN AÇMA MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Yeni İlan Aç 🚀</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreatePost} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ne arıyorsun / Neye ihtiyacın var?</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-32 resize-none transition-all"
                  placeholder="Örn: Analitik Kimya vizesi için Discord'da çalışacak arkadaş arıyorum..."
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Etiketler (Virgülle ayır)</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Örn: Kimya, Soru Çözümü, Üniversite"
                />
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPosting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {isPosting ? "Kabileye Gönderiliyor..." : "İlanı Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sol Menü (Sidebar) */}
      <aside className="w-64 bg-gray-800/50 border-r border-gray-700 hidden md:flex flex-col p-6 backdrop-blur-xl h-screen sticky top-0">
        <div className="mb-12">
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            SinerjiHub
          </h1>
        </div>
        
        <nav className="flex-1 space-y-4">
          <Link href="/dashboard" className="flex items-center gap-3 text-white bg-blue-600/20 px-4 py-3 rounded-xl border border-blue-500/30 transition-all">
            <span>🏠</span> Ana Üs
          </Link>
          <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-700/50 px-4 py-3 rounded-xl transition-all">
            <span>🔥</span> Kabilelerim
          </Link>
          <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-700/50 px-4 py-3 rounded-xl transition-all">
            <span>💬</span> Mesajlar <span className="ml-auto bg-blue-500 text-xs px-2 py-0.5 rounded-full text-white">3</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-700/50 px-4 py-3 rounded-xl transition-all">
            <span>🎯</span> Çalışma Odaları
          </Link>
        </nav>

        {/* ALT KISIM: ÇIKIŞ VE PROFİL */}
        <div className="mt-auto space-y-4 border-t border-gray-700 pt-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-3 rounded-xl transition-all text-sm font-medium"
          >
            <span>🚪</span> Çıkış Yap
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-lg uppercase shadow-[0_0_10px_rgba(168,85,247,0.4)] flex-shrink-0">
              {user?.username ? user.username.charAt(0) : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.username || "Kullanıcı"}</p>
              <p className="text-xs text-blue-400">{user?.karmaPoints || 10} Karma Puanı 🌟</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold">Tekrar Hoş Geldin, {user?.username || "Gezgin"}! 🚀</h2>
            <p className="text-gray-400 mt-1">İşte bugün ekosistemde olup bitenler.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"
          >
            + Yeni İlan Aç
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Önerilen Kabileler */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Senin İçin Önerilen Kabileler</h3>
              <Link href="#" className="text-sm text-blue-400 hover:underline">Hepsini Gör</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedHubs.map((hub) => (
                <div key={hub.id} className="bg-gray-800/40 border border-gray-700 p-5 rounded-2xl hover:border-gray-500 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{hub.icon}</span>
                    <span className="text-xs font-medium bg-gray-700/50 px-2.5 py-1 rounded-full text-gray-300">
                      {hub.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{hub.name}</h4>
                  <p className="text-sm text-gray-400">{hub.members} Üye</p>
                  <button className="mt-4 w-full py-2 rounded-xl bg-gray-700/50 hover:bg-blue-600 hover:text-white transition-colors text-sm font-medium">
                    Kabileye Katıl
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GERÇEK İLANLAR AKIŞI */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">İlanlar & Çalışma Odaları</h3>
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-gray-800/40 border border-gray-700 p-6 rounded-2xl text-center text-gray-400">
                  Henüz bir ilan yok. İlk ilanı sen aç!
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="bg-gray-800/40 border border-gray-700 p-5 rounded-2xl transition-all hover:border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-400 text-sm">{post.username}</span>
                      <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                      {post.content}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span key={index} className="text-[10px] uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <button className="w-full py-2 rounded-xl border border-gray-600 hover:bg-gray-700 transition-colors text-sm font-medium">
                      Mesaj At
                    </button>
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