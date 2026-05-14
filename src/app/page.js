export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl text-center space-y-8">
        
        {/* Üstteki Ufak Rozet */}
        <div className="inline-block px-4 py-1.5 rounded-full border border-gray-700 bg-gray-800/50 text-sm font-medium text-gray-300 mb-4 shadow-sm">
          🚀 SinerjiHub Alpha v0.1 Yayında!
        </div>

        {/* Ana Başlık */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Kendi Kabileni <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Keşfet ve Büyü.
          </span>
        </h1>

        {/* Alt Metin */}
        <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Öğren, geliştir, oyna. Ortak paydada buluşan öğrencilerin, öğretmenlerin, yazılımcıların ve oyuncuların yeni dijital evi.
        </p>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <a href="/login" className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transform hover:-translate-y-1">
     Hemen Katıl
       </a>
          <button className="px-8 py-4 rounded-full border border-gray-600 hover:border-gray-400 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-lg transition-all transform hover:-translate-y-1">
            Daha Fazla Bilgi
          </button>
        </div>

      </div>

      {/* Arka plan süslemesi (Işık hüzmesi) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    </div>
  );
}