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

// --- SİNERJİHUB PWA VE SEO METADATA KİMLİĞİ ---
export const metadata = {
  title: "SinerjiHub | Dijital Kabile Ekosistemi",
  description: "Gezginler, öğrenciler ve geliştiriciler için uçtan uca etkileşimli sinerji ağı ve kabile platformu.",
  generator: "Next.js",
  manifest: "/manifest.json", 
  keywords: ["sinerjihub", "eğitim", "yazılım", "kabile", "webrtc", "pwa", "sosyal ağ"],
  authors: [{ name: "Mehmet Alptuğ Akgün" }],
  icons: [
    { rel: "apple-touch-icon", url: "/icon-192x192.png" },
    { rel: "icon", url: "/favicon.ico" },
  ],
};

// --- MOBİL CİHAZ VİTRİN AYARLARI ---
export const viewport = {
  themeColor: "#030027", // Tarayıcı üst çubuğu Prussian Blue oldu
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false, 
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-prussian text-beige">
        {children}
      </body>
    </html>
  );
}