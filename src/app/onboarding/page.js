"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { id: "ogrenci", icon: "📚", label: "Öğrenci" },
    { id: "ogretmen", icon: "🎓", label: "Eğitmen / Öğretmen" },
    { id: "yazilimci", icon: "💻", label: "Yazılımcı" },
    { id: "gamer", icon: "🎮", label: "Gamer" },
    { id: "tasarimci", icon: "🎨", label: "Tasarımcı / Üretici" },
  ];

  const interests = [
    "Organik Kimya", "YKS Hazırlık", "React.js", "GTA 5 RP", 
    "Canva", "YBS", "LGS Fen Bilimleri", "Roblox", 
    "Analitik Kimya", "UI/UX", "Oyun Sunucusu Kurulumu", "Matematik"
  ];

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // YENİ: Verileri CANLI Backend'e Gönderme Motoru
  const handleSaveProfile = async () => {
    setIsSaving(true);
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("Kimlik bulunamadı, lütfen tekrar giriş yapın.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roles: selectedRoles, interests: selectedInterests }),
      });

      if (res.ok) {
        router.push("/dashboard"); 
      } else {
        alert("Profil kaydedilirken bir sorun oluştu.");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-700">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Aramıza Hoş Geldin! 👋</h2>
              <p className="text-gray-400">SinerjiHub'da kendini nasıl tanımlarsın?</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {roles.map((role) => (
                <button key={role.id} onClick={() => toggleSelection(role.id, selectedRoles, setSelectedRoles)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedRoles.includes(role.id) ? "border-blue-500 bg-blue-500/10 scale-105" : "border-gray-700 hover:border-gray-500 bg-gray-900/50"}`}>
                  <span className="text-3xl">{role.icon}</span>
                  <span className="font-medium">{role.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Nelerle İlgileniyorsun? 🎯</h2>
              <p className="text-gray-400">Odaklandığın alanları, yeteneklerini veya hobilerini seç.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {interests.map((interest) => (
                <button key={interest} onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)} className={`px-4 py-2 rounded-full border transition-all ${selectedInterests.includes(interest) ? "border-purple-500 bg-purple-500/20 text-purple-200" : "border-gray-600 hover:border-gray-400 text-gray-300"}`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✨</span>
            </div>
            <h2 className="text-3xl font-bold">Harika! Profilin Hazır.</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Seçimlerine göre sana en uygun çalışma odalarını ve kabileleri bulmak için algoritmamızı çalıştırıyoruz.
            </p>
          </div>
        )}

        <div className="mt-12 flex justify-between items-center">
          {step > 1 ? <button onClick={() => setStep(step - 1)} className="px-6 py-2 rounded-xl text-gray-400 hover:text-white transition-colors">Geri</button> : <div></div>}

          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 && selectedRoles.length === 0} className={`px-8 py-3 rounded-xl font-bold transition-all ${(step === 1 && selectedRoles.length === 0) ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"}`}>
              Devam Et
            </button>
          ) : (
            <button onClick={handleSaveProfile} disabled={isSaving} className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all mx-auto">
              {isSaving ? "Kaydediliyor..." : "Kabileme Git 🚀"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}