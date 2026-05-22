export default function Home() {
  return (
    <div className="min-h-screen bg-[#030027] text-[#F2F3D9] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="max-w-4xl text-center space-y-8 z-10">
        
        {/* Üstteki Ufak Rozet */}
        <div className="inline-block px-4 py-1.5 rounded-full border border-[#DE7A00]/40 bg-[#DE7A00]/10 text-xs font-bold text-[#DE7A00] mb-4 shadow-sm uppercase tracking-widest">
          🚀 SinerjiHub Pro v2.0 Yayında!
        </div>

        {/* Ana Başlık */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
          Kendi Kabileni <br className="hidden md:block" />
          <span className="text-[#DE7A00]">
            İnşa Et ve Yönet.
          </span>
        </h1>

        {/* Alt Metin */}
        <p className="text-lg md:text-xl text-[#F2F3D9]/60 max-w-2xl mx-auto leading-relaxed font-medium">
          Geliştiriciler, mühendisler ve profesyoneller için uçtan uca etkileşimli ortak çalışma ağı, canlı laboratuvar ve sinerji ekosistemi.
        </p>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <a href="/login" className="px-10 py-4 rounded-xl bg-[#DE7A00] hover:bg-[#c26a00] text-[#030027] font-black text-sm uppercase tracking-widest transition-colors shadow-lg">
            EKOSİSTEME GİRİŞ YAP
          </a>
          <button className="px-10 py-4 rounded-xl border border-[#F2F3D9]/20 hover:border-[#DE7A00] hover:text-[#DE7A00] bg-[#02001a] text-[#F2F3D9] font-bold text-sm uppercase tracking-widest transition-colors">
            MİMARİYİ İNCELE
          </button>
        </div>
      </div>

      {/* Arka plan süslemesi (Işık hüzmesi) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#DE7A00]/5 rounded-full blur-[150px] pointer-events-none"></div>
    </div>
  );
}