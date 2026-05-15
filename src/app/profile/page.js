"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        // 1. Kullanıcı bilgilerini çek
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        const userData = await userRes.json();
        setUser(userData);

        // 2. Kullanıcının kendi ilanlarını çek
        const postsRes = await fetch(`https://sinerjihub-1.onrender.com/api/posts/user/${userId}`);
        const postsData = await postsRes.json();
        setUserPosts(postsData);

      } catch (error) {
        console.error("Profil verileri çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium text-gray-400">Profilin Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Üst Kısım: Geri Dön ve Başlık */}
        <div className="mb-10 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            ← Ana Üsse Dön
          </Link>
          <h1 className="text-2xl font-bold">Üye Profili</h1>
        </div>

        {/* Profil Kartı */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8 backdrop-blur-xl mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-5xl font-bold shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              {user?.username?.charAt(0).toUpperCase()}
            </div>

            {/* Bilgiler */}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-4xl font-extrabold mb-2">{user?.username}</h2>
              <p className="text-gray-400 mb-4">{user?.email}</p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-400 text-sm font-medium">
                  🌟 {user?.karmaPoints || 10} Karma
                </div>
                <div className="bg-gray-700/50 px-4 py-1.5 rounded-full text-gray-300 text-sm">
                  📅 Katılım: {new Date(user?.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>
          </div>

          {/* Roller ve İlgi Alanları (Onboarding Verileri) */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-700 pt-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Üstlendiği Roller</h3>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.length > 0 ? user.roles.map(role => (
                  <span key={role} className="bg-blue-600/10 border border-blue-600/30 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-tight">
                    {role}
                  </span>
                )) : <span className="text-gray-600 text-sm">Henüz rol seçilmedi.</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Uzmanlık & İlgi Alanları</h3>
              <div className="flex flex-wrap gap-2">
                {user?.interests?.length > 0 ? user.interests.map(interest => (
                  <span key={interest} className="bg-purple-600/10 border border-purple-600/30 text-purple-400 px-3 py-1 rounded-lg text-xs">
                    {interest}
                  </span>
                )) : <span className="text-gray-600 text-sm">İlgi alanı belirtilmedi.</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Kullanıcının İlanları */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">Senin İlanların 📣</h3>
          {userPosts.length === 0 ? (
            <div className="bg-gray-800/30 border border-dashed border-gray-700 p-12 rounded-3xl text-center">
              <p className="text-gray-500 mb-4">Henüz kabileye bir seslenişte bulunmadın.</p>
              <Link href="/dashboard" className="text-blue-400 hover:underline">İlk ilanını açmak için Dashboard'a git</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPosts.map(post => (
                <div key={post._id} className="bg-gray-800/40 border border-gray-700 p-6 rounded-2xl">
                  <p className="text-gray-300 mb-4 leading-relaxed">{post.content}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags?.map(tag => (
                      <span key={tag} className="text-[10px] uppercase font-bold bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {new Date(post.createdAt).toLocaleString('tr-TR')} tarihinde yayınlandı.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}