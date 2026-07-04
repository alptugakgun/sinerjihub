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

  const broadTags = [
    { id: "yazilim", label: "Yazılım & Teknoloji", icon: "💻" },
    { id: "veri", label: "Veri Bilimi", icon: "📊" },
    { id: "yapayzeka", label: "Yapay Zeka (AI)", icon: "🤖" },
    { id: "muhendislik", label: "Mühendislik", icon: "⚙️" },
    { id: "tasarim", label: "UI/UX Tasarım", icon: "🎨" },
    { id: "siber", label: "Siber Güvenlik", icon: "🛡️" },
    { id: "girisim", label: "Girişimcilik", icon: "🚀" },
    { id: "matematik", label: "Matematik & Algoritma", icon: "📐" }
  ];

  const handleToggleInterest = (tagLabel) => {
    if (selectedInterests.includes(tagLabel)) {
      setSelectedInterests(selectedInterests.filter(t => t !== tagLabel));
    } else {
      if (selectedInterests.length >= 5) {
        alert("Sisteme en fazla 5 uzmanlık alanı tanıtabilirsin.");
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
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          interests: selectedInterests
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Kimlik başarıyla oluşturuldu. Oturum açabilirsin.");
        router.push("/login");
      } else {
        alert(data.message || "Kayıt protokolü reddedildi.");
      }
    } catch (error) {
      alert("Ağ bağlantısı koptu, daha sonra tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030027] text-[#F2F3D9] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Arka Plan Efekti */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DE7A00]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-2xl bg-[#02001a] border border-[#F2F3D9]/10 rounded-2xl p-8 md:p-12 shadow-2xl relative z-10">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#F2F3D9] tracking-wide mb-2">
            SINERJI<span className="text-[#DE7A00]">HUB</span>
          </h1>
          <p className="text-[#F2F3D9]/50 text-[10px] font-bold uppercase tracking-widest">Ağ Katılım Protokolü</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
          
          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9]/60 mb-2 ml-2">Sistem Kullanıcı Adı</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl px-5 py-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors"
                placeholder="Örn: developer_tr"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9]/60 mb-2 ml-2">Kurumsal E-Posta</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl px-5 py-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors"
                placeholder="Örn: mail@domain.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9]/60 mb-2 ml-2">Güvenlik Şifresi</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl px-5 py-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors"
                placeholder="Güçlü bir anahtar belirle"
              />
            </div>
          </div>

          {/* Uzmanlık Alanları */}
          <div className="pt-4 border-t border-[#F2F3D9]/10">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9]/60 mb-4 ml-2">
              Uzmanlık / İlgi Alanı Belirle (Maksimum 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {broadTags.map((tag) => {
                const isSelected = selectedInterests.includes(tag.label);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleToggleInterest(tag.label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${
                      isSelected 
                        ? "bg-[#DE7A00]/20 text-[#DE7A00] border-[#DE7A00]/50" 
                        : "bg-[#030027] text-[#F2F3D9]/50 border-[#F2F3D9]/10 hover:border-[#DE7A00]/30 hover:text-[#F2F3D9]"
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
              className="w-full bg-[#DE7A00] hover:bg-[#c26a00] text-[#030027] font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "KİMLİK OLUŞTURULUYOR..." : "PROTOKOLÜ TAMAMLA VE KATIL"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-[#F2F3D9]/10">
          <p className="text-xs text-[#F2F3D9]/50 font-medium">
            Mevcut bir kimliğin var mı?{" "}
            <Link href="/login" className="text-[#DE7A00] font-bold hover:underline underline-offset-4">
              Giriş Yap
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}