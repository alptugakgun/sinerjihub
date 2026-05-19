"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import Cookies from "js-cookie"; // YENİ: Çerez yöneticisi

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sayfa yüklendiğinde eski/bozuk ID varsa hafızayı ve çerezleri temizle ki döngüye girmesin
  useEffect(() => {
    localStorage.removeItem("userId");
    Cookies.remove("token"); // YENİ: Eski şifreli bileti yırt at
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // --- YENİ EKLENEN: BİLGİLERİ VE TOKENI KAYDET ---
        // data.user._id (Eskiden sadece data._id idi, çünkü backend artık {user, token} dönüyor)
        localStorage.setItem("userId", data.user._id);
        
        // Middleware'in okuyabilmesi için Token'ı tarayıcı çerezlerine 7 günlük yazıyoruz
        Cookies.set("token", data.token, { expires: 7, secure: true });
        
        toast.success("SinerjiHub'a hoş geldin! Yönlendiriliyorsun...", {
          style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' }
        });

        // Baloncuk görünsün diye 1 saniye bekleyip Dashboard'a atıyoruz
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        
      } else {
        // Şifre yanlışsa veya e-posta yoksa backend'den gelen hatayı baloncukla göster
        toast.error(data.message || "Giriş başarısız.", {
          style: { background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b' }
        });
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Sunucuya ulaşılamıyor. Render uyanıyor olabilir, biraz bekle dostum.", {
        style: { background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b' }
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden bg-grid-slate-900/[0.04]">
      
      {/* Bildirim Baloncukları */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Arka Plan Efektleri */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter italic mb-2">
            SINERJIHUB
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ekosisteme Giriş Yap</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">E-Posta Adresi</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all shadow-inner"
              placeholder="gezgin@sinerjihub.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Şifre</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 disabled:opacity-50 mt-4"
          >
            {isLoading ? "SİNERJİ BAĞLANIYOR..." : "SİSTEME GİR"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-800 pt-6">
          <p className="text-gray-500 text-xs font-medium">
            Henüz kabileye katılmadın mı?{" "}
            <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline decoration-blue-500/30 underline-offset-4">
              Hesap Oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}