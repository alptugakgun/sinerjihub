"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("userId");
    Cookies.remove("token"); 
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("https://sinerjihub-1.onrender.com/api/auth/login", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userId", data.user._id);
        Cookies.set("token", data.token, { expires: 7, secure: true });
        
        toast.success("Kimlik doğrulandı! Yönlendiriliyorsun...", {
          style: { background: '#005700', color: '#F2F3D9' }
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        
      } else {
        toast.error(data.message || "Erişim reddedildi.", {
          style: { background: '#520000', color: '#F2F3D9' }
        });
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Sunucu yanıt vermiyor. Sistem uyanıyor olabilir.", {
        style: { background: '#520000', color: '#F2F3D9' }
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030027] text-[#F2F3D9] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Arka Plan Efekti */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#DE7A00]/5 rounded-full blur-[100px] -z-10"></div>
      
      <div className="w-full max-w-md bg-[#02001a] border border-[#F2F3D9]/10 rounded-2xl p-10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#F2F3D9] tracking-wide mb-2">
            SINERJI<span className="text-[#DE7A00]">HUB</span>
          </h1>
          <p className="text-[#F2F3D9]/50 text-[10px] font-bold uppercase tracking-widest">Merkezi Otorite Girişi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9]/60 mb-2 ml-2">Kurumsal E-Posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl px-5 py-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors shadow-inner"
              placeholder="gezgin@sinerjihub.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9]/60 mb-2 ml-2">Güvenlik Şifresi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl px-5 py-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#DE7A00] hover:bg-[#c26a00] text-[#030027] font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-colors disabled:opacity-50 mt-4"
          >
            {isLoading ? "DOĞRULANIYOR..." : "OTURUM AÇ"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#F2F3D9]/10 pt-6">
          <p className="text-[#F2F3D9]/50 text-xs font-medium">
            Henüz ağa dahil olmadın mı?{" "}
            <Link href="/register" className="text-[#DE7A00] font-bold hover:underline underline-offset-4">
              Kayıt Formu Oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}