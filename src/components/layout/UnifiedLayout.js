"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function UnifiedLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sayfalara göre layout stratejisi
  const isAuth = pathname === "/login" || pathname === "/register";
  const isLanding = pathname === "/";
  const isAppPage = !isAuth && !isLanding;

  // Discord benzeri sol Hub (Sunucu) barı
  const hubs = [
    { id: 1, name: "Yazılım", color: "bg-blue-500", short: "YZ" },
    { id: 2, name: "Tasarım", color: "bg-pink-500", short: "TS" },
    { id: 3, name: "Girişim", color: "bg-emerald-500", short: "GR" },
  ];

  // LinkedIn tarzı ana navigasyon (İkincil sidebar)
  const navLinks = [
    { path: "/dashboard", label: "Ana Akış", icon: "🏠" },
    { path: "/explore", label: "Keşfet", icon: "🌍" },
    { path: "/messages", label: "Mesajlar", icon: "💬" },
    { path: "/hubs", label: "Kabileler", icon: "⛺" },
    { path: "/profile", label: "Profilim", icon: "👤" },
    { path: "/admin", label: "Yönetim", icon: "⚙️" },
  ];

  if (isAuth || isLanding) {
    // Landing ve Auth için daha sade, ortalanmış ama aynı renk paletini kullanan bir yapı
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        {/* Üst Navigasyon (LinkedIn stili yatay) */}
        <header className="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-discord-bg)] flex items-center justify-between px-6 sticky top-0 z-50">
          <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-[var(--color-linkedin-blue)] flex items-center justify-center text-white font-black">S</span>
            SinerjiHub
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">Giriş Yap</Link>
            <Link href="/register" className="text-sm font-medium bg-[var(--color-linkedin-blue)] hover:bg-[var(--color-linkedin-blue-hover)] text-white px-4 py-1.5 rounded-full transition-colors">Kayıt Ol</Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  // App içi yapı (Discord ve LinkedIn karması)
  return (
    <div className="h-screen flex bg-[var(--background)] text-[var(--color-text-primary)] overflow-hidden">
      
      {/* 1. KADEME SOL BAR: Hubs (Discord Stili) */}
      <nav className="w-[72px] bg-[var(--color-discord-bg)] flex flex-col items-center py-3 gap-2 border-r border-[var(--color-border-subtle)] shrink-0 z-20">
        <Link href="/dashboard" className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[var(--color-discord-card)] hover:bg-[var(--color-linkedin-blue)] transition-all duration-200 flex items-center justify-center text-white mb-2 group relative">
          <span className="font-bold text-lg group-hover:text-white">SH</span>
        </Link>
        <div className="w-8 h-[2px] bg-[var(--color-border-subtle)] rounded-full mb-2"></div>
        {hubs.map(hub => (
          <button key={hub.id} className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[var(--color-discord-card)] transition-all duration-200 flex items-center justify-center text-white relative group overflow-hidden">
            <div className={`absolute left-0 w-1 h-0 bg-white rounded-r-lg group-hover:h-5 transition-all`}></div>
            <span className="font-semibold">{hub.short}</span>
          </button>
        ))}
        <button className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[var(--color-discord-hover)] text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200 flex items-center justify-center mt-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </nav>

      {/* 2. KADEME SOL BAR: Navigasyon (LinkedIn Sol Sidebar Stili ama Discord görünümünde) */}
      <aside className="w-64 bg-[var(--color-discord-card)] flex flex-col border-r border-[var(--color-border-subtle)] shrink-0 z-10 hidden md:flex">
        {/* Üst Kısım - Aktif Hub veya Profil Özeti */}
        <div className="h-16 px-4 flex items-center shadow-sm border-b border-[var(--color-border-subtle)] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
          Ana Menü
        </div>
        
        {/* Nav Linkleri */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {navLinks.map(link => {
            const isActive = pathname === link.path;
            return (
              <Link key={link.path} href={link.path} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-[var(--color-discord-hover)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-discord-hover)] hover:text-[var(--color-text-primary)]'}`}>
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Alt Kısım - Kullanıcı Bilgisi (Discord Tarzı Profil Barı) */}
        <div className="h-[52px] bg-[var(--color-discord-hover)] p-1.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-linkedin-blue)] flex items-center justify-center font-bold text-white shrink-0 cursor-pointer hover:opacity-80 transition">
            MA
          </div>
          <div className="flex-1 min-w-0 cursor-pointer">
            <div className="text-sm font-semibold text-white truncate leading-tight">Mehmet Alptuğ</div>
            <div className="text-xs text-[var(--color-text-muted)] truncate">Yazılım Geliştirici</div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-white rounded hover:bg-[var(--color-border-subtle)] transition">
            ⚙️
          </button>
        </div>
      </aside>

      {/* 3. ANA İÇERİK ALANI (LinkedIn Feed / Discord Chat Alanı) */}
      <main className="flex-1 bg-[var(--background)] flex flex-col min-w-0 relative">
        {/* Mobil Header (Mobilde sol barlar gizlendiği için) */}
        <header className="md:hidden h-14 border-b border-[var(--color-border-subtle)] bg-[var(--color-discord-card)] flex items-center px-4 shrink-0">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mr-3 text-white">
            ☰
          </button>
          <span className="font-bold text-white">SinerjiHub</span>
        </header>

        {/* Üst Bar (LinkedIn Tarzı Hızlı Arama veya Breadcrumb) */}
        <div className="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--background)] flex items-center px-6 shrink-0 hidden md:flex shadow-sm">
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Arama yapın (Kişiler, Kabileler, İçerikler)..." className="w-full bg-[var(--color-discord-bg)] border border-[var(--color-border-subtle)] rounded-full px-4 py-1.5 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-linkedin-blue)] transition-colors" />
            <span className="absolute right-3 top-1.5 text-[var(--color-text-muted)] text-sm">🔍</span>
          </div>
        </div>

        {/* Sayfa İçeriği */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}