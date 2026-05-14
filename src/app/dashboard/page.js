"use client";
import Link from "next/link";

export default function DashboardPage() {
  // Arayüzü canlandırmak için örnek kabile (Hub) verileri
  const recommendedHubs = [
    { id: 1, name: "YBS Geliştiricileri", members: 342, category: "Yazılım & Yönetim", icon: "💻" },
    { id: 2, name: "Organik Kimya Lab", members: 128, category: "Eğitim", icon: "🧪" },
    { id: 3, name: "GTA 5 RP Sunucusu", members: 856, category: "Oyun", icon: "🎮" },
    { id: 4, name: "Next.js & React", members: 512, category: "Yazılım", icon: "⚛️" }
  ];

  // Örnek İlanlar / Çalışma Odaları
  const activeRequests = [
    { id: 1, user: "Ahmet Y.", request: "LGS Fen Bilimleri deneme çözümü için çalışma arkadaşı arıyorum.", time: "10 dk önce", tags: ["Öğrenci", "Eğitim"] },
    { id: 2, user: "Zeynep T.", request: "Yeni startup projemiz için UI/UX tasarımlarını Canva'da toparlayacak biri lazım.", time: "45 dk önce", tags: ["Tasarım", "Proje"] },
    { id: 3, user: "Can K.", request: "Analitik Kimya vize öncesi soru çözüm kampı (Discord'da toplanıyoruz).", time: "2 saat önce", tags: ["Kimya", "Üniversite"] }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      
      {/* Sol Menü (Sidebar) */}
      <aside className="w-64 bg-gray-800/50 border-r border-gray-700 hidden md:flex flex-col p-6 backdrop-blur-xl">
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

        {/* Kullanıcı Profili Özeti */}
        <div className="mt-auto border-t border-gray-700 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
              K
            </div>
            <div>
              <p className="text-sm font-medium">Kullanıcı</p>
              <p className="text-xs text-gray-400">120 Karma Puanı 🌟</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Üst Karşılama Barı */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold">Tekrar Hoş Geldin! 🚀</h2>
            <p className="text-gray-400 mt-1">İşte bugün ekosistemde olup bitenler.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            + Yeni İlan Aç
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sol Kolon (Kabileler - 2 birim genişlik) */}
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

          {/* Sağ Kolon (İlanlar / Yardımlaşma - 1 birim genişlik) */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">İlanlar & Çalışma Odaları</h3>
            <div className="space-y-4">
              {activeRequests.map((req) => (
                <div key={req.id} className="bg-gray-800/40 border border-gray-700 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-400 text-sm">{req.user}</span>
                    <span className="text-xs text-gray-500">{req.time}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    {req.request}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {req.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="w-full py-2 rounded-xl border border-gray-600 hover:bg-gray-700 transition-colors text-sm font-medium">
                    Mesaj At
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}