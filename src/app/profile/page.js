"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Profil verilerini ve kullanıcının ilanlarını çeken ana motor
  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        // 1. Kullanıcı Verisini Çek
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else {
          localStorage.removeItem("userId");
          router.push("/login");
          return;
        }

        // 2. Sadece Bu Kullanıcının İlanlarını Çek
        const postsRes = await fetch(`https://sinerjihub-1.onrender.com/api/posts/user/${userId}`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setUserPosts(postsData);
        }

      } catch (error) {
        console.error("Profil verisi çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  // --- YENİ: FOTOĞRAFI GÖRÜP BASE64'E ÇEVİREN VE SUNUCUYA ATAN MOTOR ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (Base64 veritabanını yormasın diye 2MB sınırı koyuyoruz)
    if (file.size > 2 * 1024 * 1024) {
      alert("Fotoğraf boyutu çok büyük dostum! Maksimum 2MB bir görsel seçmelisin.");
      return;
    }

    setIsUploading(true);
    const userId = localStorage.getItem("userId");

    const reader = new FileReader();
    reader.readAsDataURL(file); // Görseli oku ve Base64 string'e dönüştür
    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        const res = await fetch(`https://sinerjihub-1.onrender.com/api/auth/update-avatar/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePicture: base64Image }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("Profil fotoğrafın başarıyla güncellendi! 🎉");
          // Arayüzü anında güncellemek için user state'ini yeniliyoruz
          setUser({ ...user, profilePicture: base64Image });
        } else {
          alert(data.message || "Fotoğraf yüklenemedi.");
        }
      } catch (err) {
        alert("Sunucuyla bağlantı hatası oluştu.");
      } finally {
        setIsUploading(false);
      }
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Profil Dünyası Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500/30 overflow-y-auto">
      
      {/* ÜST BAR (NAVBAR) */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter">
            SINERJIHUB
          </h1>
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> ANA ÜSSE DÖN
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* KİMLİK KARTI (HERO SECTION) */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden mb-12">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
          
          {/* FOTOĞRAF DEĞİŞTİRME ALANI */}
          <div className="relative group cursor-pointer flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-black text-6xl shadow-2xl ring-4 ring-gray-900 overflow-hidden relative">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0].toUpperCase()
              )}
              
              {/* Üzerine gelince açılan havalı panel */}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest text-white transition-opacity duration-200 cursor-pointer">
                <span>{isUploading ? "Yükleniyor..." : "Değiştir 📸"}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 italic uppercase">{user?.username}</h2>
            <p className="text-gray-400 font-medium tracking-widest text-sm mb-6">{user?.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-gray-900/50 border border-gray-700 px-6 py-3 rounded-2xl flex flex-col items-center md:items-start">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sinerji Puanı</span>
                <span className="text-2xl font-black text-blue-400">{user?.karmaPoints || 0}</span>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 px-6 py-3 rounded-2xl flex flex-col items-center md:items-start">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kabileler</span>
                <span className="text-2xl font-black text-purple-400">{user?.hubs?.length || 0}</span>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 px-6 py-3 rounded-2xl flex flex-col items-center md:items-start">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Arkadaşlar</span>
                <span className="text-2xl font-black text-green-400">{user?.friends?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* SOL KOLON: SOSYAL AĞ */}
          <div className="space-y-8">
            <div className="bg-gray-800/30 border border-gray-700/50 p-8 rounded-[2rem]">
              <h3 className="text-sm font-black tracking-widest uppercase mb-6 text-gray-400 border-b border-gray-700/50 pb-4">Ağındaki Kişiler</h3>
              {user?.friends?.length === 0 ? (
                <p className="text-xs text-gray-500 font-medium">Henüz bir kabile dostun yok. İlanlardan insanlara ulaş!</p>
              ) : (
                <div className="space-y-4">
                  {user?.friends?.map(friendId => (
                    <div key={friendId} className="flex items-center gap-4 bg-gray-900/50 p-3 rounded-2xl border border-gray-700/30">
                      <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center font-bold">
                        👤
                      </div>
                      <div>
                        <p className="text-sm font-bold">Gezgin #{friendId.substring(0,4)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Bağlantı Kuruldu</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SAĞ KOLON: İLAN GEÇMİŞİ */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-sm font-black tracking-widest uppercase text-gray-400 border-b border-gray-800 pb-4">Senin İlanların & Çağrıların</h3>
            
            <div className="space-y-6">
              {userPosts.length === 0 ? (
                <div className="bg-gray-800/20 border border-dashed border-gray-700 p-12 rounded-[2rem] text-center">
                  <p className="text-gray-500 font-bold text-sm">Hiç ilan açmamışsın. Sinerjiyi başlatmak için ana üsse dön macro çağrını yap!</p>
                </div>
              ) : (
                userPosts.map(post => (
                  <div key={post._id} className="bg-gray-800/30 border border-gray-700/50 p-8 rounded-[2rem] hover:bg-gray-800/50 transition-all group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{formatDate(post.createdAt)}</span>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {post.upvotes?.length || 0} Destek
                      </span>
                    </div>
                    <p className="text-base text-gray-200 mb-6 leading-relaxed font-medium">{post.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag, index) => (
                        <span key={index} className="text-[10px] font-black uppercase tracking-widest bg-gray-900 text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg">
                          #{tag}
                        </span>
                      ))}
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