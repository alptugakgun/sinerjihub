"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // VİZYON: Kapsayıcı, geniş ve topluluğu birleştiren ana etiketler
  const broadTags = [
    { id: "yazilim", label: "Yazılım & Teknoloji", icon: "💻" },
    { id: "kimya", label: "Kimya & Bilim", icon: "🧪" },
    { id: "egitim", label: "Eğitim & Sınavlar", icon: "📚" },
    { id: "muhendislik", label: "Mühendislik", icon: "⚙️" },
    { id: "tasarim", label: "Tasarım & Sanat", icon: "🎨" },
    { id: "oyun", label: "Oyun & E-Spor", icon: "🎮" },
    { id: "spor", label: "Spor & Yaşam", icon: "🏋️‍♂️" },
    { id: "girisim", label: "İş & Girişimcilik", icon: "🚀" },
    { id: "yabancidil", label: "Yabancı Dil", icon: "🌍" },
    { id: "matematik", label: "Matematik", icon: "📐" }
  ];

  const handleToggleInterest = (tagLabel) => {
    if (selectedInterests.includes(tagLabel)) {
      setSelectedInterests(selectedInterests.filter(t => t !== tagLabel));
    } else {
      if (selectedInterests.length >= 5) {
        alert("En fazla 5 ilgi alanı seçebilirsin dostum.");
        return;
      }
      setSelectedInterests([...selectedInterests, tagLabel]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          interests: selectedInterests
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Aramıza hoş geldin! Giriş yapabilirsin. 🎉");
        router.push("/login");
      } else {
        alert(data.message || "Kayıt başarısız oldu.");
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı, lütfen daha sonra tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center p-6 selection:bg-blue-500/30">
      
      {/* Arka Plan Efektleri */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative z-10">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-2 italic">SINERJIHUB</h1>
          <p className="text-gray-400 font-medium text-sm">Ekosisteme katıl ve sinerjiyi başlat.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
          
          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Kullanıcı Adı</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all shadow-inner"
                placeholder="Örn: gezgin_ybs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">E-Posta Adresi</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all shadow-inner"
                placeholder="Örn: merhaba@sinerjihub.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Şifre</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all shadow-inner"
                placeholder="Güçlü bir şifre belirle"
              />
            </div>
          </div>

          {/* İlgi Alanları (Yeni Kapsayıcı Etiketler) */}
          <div className="pt-4 border-t border-gray-700/50">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-2 text-center md:text-left">
              Ana İlgi Alanlarını Seç (En Fazla 5)
            </label>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {broadTags.map((tag) => {
                const isSelected = selectedInterests.includes(tag.label);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleToggleInterest(tag.label)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? "bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                        : "bg-gray-900/50 text-gray-400 border-gray-700/50 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading || formData.username === "" || formData.email === "" || formData.password === ""}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-5 rounded-full uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "SİSTEME KAYDEDİLİYOR..." : "EKOSİSTEME KATIL"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Zaten bir kabile üyesi misin?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest underline decoration-blue-400/30 underline-offset-4">
              Giriş Yap
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}