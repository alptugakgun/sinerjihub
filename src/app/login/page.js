"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false); // Test için Kayıt Ol ekranını varsayılan yaptık
  const router = useRouter();

  // Form Verileri İçin Hafıza (State)
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form Gönderildiğinde Çalışacak Motor
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    if (!isLogin) {
      // KAYIT OLMA İŞLEMİ
      try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          // Başarılıysa Onboarding'e gönder
          router.push("/onboarding");
        } else {
          // Hata varsa ekrana yazdır (Örn: Bu e-posta zaten kullanımda)
          setErrorMsg(data.message);
        }
      } catch (err) {
        setErrorMsg("Sunucuya bağlanılamadı. Backend çalışıyor mu?");
      }
    } else {
      // GİRİŞ YAPMA İŞLEMİ (Şimdilik boş, burayı sonra API'ye bağlayacağız)
      router.push("/dashboard"); 
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors mb-4 inline-block">
            ← Ana Sayfaya Dön
          </Link>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            {isLogin ? "Tekrar Hoş Geldin!" : "Kabileye Katıl"}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {isLogin ? "Maceraya kaldığın yerden devam et." : "SinerjiHub'ın bir parçası olmak için ilk adım."}
          </p>
        </div>

        {/* Hata Mesajı Kutusu */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Kullanıcı Adı</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                placeholder="Kullanıcı Adın" 
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-posta</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="ornek@mail.com" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50"
          >
            {isLoading ? "Yükleniyor..." : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-4 text-gray-500 text-sm">veya</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          {isLogin ? "Henüz hesabın yok mu?" : "Zaten bir hesabın var mı?"}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
            {isLogin ? "Hemen Kayıt Ol" : "Giriş Yap"}
          </button>
        </div>
      </div>
    </div>
  );
}