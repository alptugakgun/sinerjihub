"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function HubDetailPage() {
  const { id: hubId } = useParams(); // URL'den kabilenin ID'sini alıyoruz
  const router = useRouter();

  const [hub, setHub] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const messagesEndRef = useRef(null);

  // Yeni mesaj geldiğinde en alta otomatik kaydırma motoru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHubData = async () => {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        // 1. Kullanıcı Bilgisini Çek (Mesaj atarken adını kullanmak için)
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);

          // Güvenlik: Kullanıcı bu kabileye üye mi? (Değilse Dashboard'a geri at)
          if (!userData.hubs.includes(hubId)) {
            alert("Bu kabile odasına girmek için önce üye olmalısın dostum!");
            router.push("/dashboard");
            return;
          }
        }

        // 2. Kabile Detaylarını ve Üyelerini Çek
        const hubRes = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}`);
        if (hubRes.ok) {
          const hubData = await hubRes.json();
          setHub(hubData);
        }

        // 3. Kabile Mesajlarını Çek
        const messagesRes = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}/messages`);
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData);
        }

      } catch (error) {
        console.error("Kabile verileri çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHubData();
  }, [hubId, router]);

  // Mesajlar yüklendiğinde en alta kaydır
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // YENİ MESAJ GÖNDERME MOTORU
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    const userId = localStorage.getItem("userId");

    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}/messages/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: newMessage }),
      });

      if (res.ok) {
        const savedMessage = await res.json();
        // Yeni mesajı mevcut listeye ekle (Ekran anında güncellenir)
        setMessages([...messages, savedMessage]);
        setNewMessage(""); // Kutuyu temizle
      } else {
        alert("Mesaj gönderilemedi.");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
    }
    setIsSending(false);
  };

  const formatDate = (dateString) => {
    const options = { hour: '2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleTimeString('tr-TR', options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium text-gray-400">Çalışma Odasına Bağlanılıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      
      {/* SOL KOLON: Kabile Bilgileri ve Üyeler */}
      <aside className="w-full md:w-80 bg-gray-800/50 border-r border-gray-700 flex flex-col p-6 backdrop-blur-xl md:h-screen md:sticky md:top-0">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors mb-8 flex items-center gap-2 text-sm font-medium">
          ← Ana Üsse Dön
        </Link>
        
        <div className="text-center mb-8 pb-8 border-b border-gray-700">
          <div className="text-6xl mb-4">{hub?.icon}</div>
          <h1 className="text-2xl font-bold mb-2">{hub?.name}</h1>
          <span className="text-xs font-medium bg-gray-700/50 px-3 py-1 rounded-full text-gray-300 uppercase tracking-wider">
            {hub?.category}
          </span>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            {hub?.description}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex justify-between items-center">
            Kabile Üyeleri
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md">{hub?.members?.length || 0}</span>
          </h3>
          <div className="space-y-3">
            {hub?.members?.map(member => (
              <div key={member._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-700/30 transition-all cursor-default">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-medium truncate text-gray-200">{member.username}</p>
                </div>
                <div className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded whitespace-nowrap">
                  {member.karmaPoints} 🌟
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* SAĞ KOLON: Sohbet ve Mesajlaşma Odası */}
      <main className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-screen relative">
        
        {/* Üst Karşılama Barı */}
        <header className="p-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-md z-10 sticky top-0">
          <h2 className="text-xl font-bold">Çalışma Odası</h2>
          <p className="text-xs text-gray-400 mt-1">Bu odadaki mesajları sadece kabile üyeleri görebilir.</p>
        </header>

        {/* Mesajların Aktığı Alan */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth bg-[#0B1120]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <span className="text-6xl opacity-50">📭</span>
              <p>Bu kabilede henüz yaprak kımıldamıyor. İlk mesajı sen at!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user === currentUser?._id;
              return (
                <div key={msg._id} className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  {!isMe && <span className="text-xs text-gray-400 mb-1 ml-1 font-medium">{msg.username}</span>}
                  <div className={`px-5 py-3 rounded-2xl shadow-md ${isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 mx-1">{formatDate(msg.createdAt)}</span>
                </div>
              );
            })
          )}
          {/* Scroll için referans noktası */}
          <div ref={messagesEndRef} />
        </div>

        {/* Mesaj Gönderme Kutusu */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/80 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`${hub?.name} kabilesine mesaj gönder...`}
              className="flex-1 bg-gray-900 border border-gray-600 rounded-full px-6 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-3.5 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.3)] flex-shrink-0"
            >
              {isSending ? "..." : "Gönder"}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}