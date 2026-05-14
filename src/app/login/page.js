"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Arka plan süslemesi */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
        {/* Geri Dön Butonu ve Başlık */}
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

        {/* Form */}
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          router.push('/onboarding');
        }}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Kullanıcı Adı</label>
              <input type="text" className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Kullanıcı Adın" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-posta</label>
            <input type="email" className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="ornek@mail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
            <input type="password" className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="••••••••" />
          </div>
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        </form>

        {/* Ayırıcı */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-4 text-gray-500 text-sm">veya şununla devam et</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* Sosyal Giriş Butonları */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 border border-gray-600 text-white font-medium py-3 rounded-xl transition-all">
            🌐 Google ile Giriş Yap
          </button>
          <button className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 rounded-xl transition-all">
            🎮 Discord ile Giriş Yap
          </button>
        </div>

        {/* Geçiş Linki */}
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