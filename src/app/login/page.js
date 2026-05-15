"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const endpoint = isLogin ? "login" : "register";
    const bodyData = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userId", data.userId);

        if (isLogin) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg("Sunucuya bağlanılamadı. Backend çalışıyor mu?");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors mb-4 inline-block">← Ana Sayfaya Dön</Link>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            {isLogin ? "Tekrar Hoş Geldin!" : "Kabileye Katıl"}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {isLogin ? "Maceraya kaldığın yerden devam et." : "SinerjiHub'ın bir parçası olmak için ilk adım."}
          </p>
        </div>

        {errorMsg && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">{errorMsg}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Kullanıcı Adı</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Kullanıcı Adın" required={!isLogin} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="ornek@mail.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {isLoading ? "Yükleniyor..." : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Henüz hesabın yok mu?" : "Zaten bir hesabın var mı?"}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
            {isLogin ? "Hemen Kayıt Ol" : "Giriş Yap"}
          </button>
        </div>
      </div>
    </div>
  );
}