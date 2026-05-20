import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- YENİ: SİNERJİHUB PWA VE SEO METADATA KİMLİĞİ ---
export const metadata = {
  title: "SinerjiHub | Dijital Kabile Ekosistemi",
  description: "Gezginler, öğrenciler ve geliştiriciler için uçtan uca etkileşimli sinerji ağı ve kabile platformu.",
  generator: "Next.js",
  manifest: "/manifest.json", // PWA (Mobil Uygulama) Kurulum Tetikleyicisi
  keywords: ["sinerjihub", "eğitim", "yazılım", "kabile", "webrtc", "pwa", "sosyal ağ"],
  authors: [{ name: "Mehmet Alptuğ Akgün" }],
  icons: [
    { rel: "apple-touch-icon", url: "/icon-192x192.png" },
    { rel: "icon", url: "/favicon.ico" },
  ],
};

// --- YENİ: MOBİL CİHAZ VİTRİN AYARLARI ---
export const viewport = {
  themeColor: "#050505", // Tarayıcı üst çubuğunu Sinerji karanlığına bürüyoruz
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Uygulama hissiyatı için ekrana zoom yapılmasını engeller
  userScalable: false, 
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr" // Sistem dili Türkçe olarak güncellendi
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Global arkaplan, metin rengi ve fare ile metin seçme (highlight) stili eklendi */}
      <body className="min-h-full flex flex-col bg-[#050505] text-white selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}