"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function HubDetailPage() {
  const { id: hubId } = useParams();
  const router = useRouter();

  const [hub, setHub] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const messagesEndRef = useRef(null);

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
        // 1. Kullanıcı Bilgisini Çek
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);

          // Güvenlik: Kullanıcı bu kabileye üye mi?
          if (!userData.hubs.includes(hubId)) {
            alert("Bu çalışma odasına girmek için kabileye katılmalısın dostum!");
            router.push("/dashboard");
            return;
          }
        } else {
          router.push("/login");
          return;
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        setMessages([...messages, savedMessage]);
        setNewMessage("");
      } else {
        alert("Mesaj gönderilemedi.");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
    }
    setIsSending(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold tracking-widest uppercase text-[10px]">Odaya Bağlanılıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* SOL KOLON: KABİLE DETAYLARI VE ÜYELER */}
      <aside className="w-full md:w-80 bg-gray-800/40 border-r border-gray-700/50 flex flex-col p-6 backdrop-blur-2xl md:h-screen md:sticky md:top-0 z-20">
        
        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> ANA ÜSSE DÖN
        </Link>
        
        <div className="text-center mb-8 pb-8 border-b border-gray-700/50 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -z-10"></div>
          <div className="text-6xl mb-4 drop-shadow-2xl">{hub?.icon}</div>
          <h1 className="text-2xl font-black mb-2 tracking-tighter italic uppercase">{hub?.name}</h1>
          <span className="text-[9px] font-black bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-indigo-400 uppercase tracking-widest">
            {hub?.category}
          </span>
          <p className="text-xs text-gray-400 mt-5 leading-relaxed font-medium">
            {hub?.description}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex justify-between items-center">
            Ağdaki Üyeler
            <span className="bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded-md text-[9px]">{hub?.members?.length || 0}</span>
          </h3>
          <div className="space-y-2">
            {hub?.members?.map(member => {
              const isMe = member._id === currentUser?._id;
              return (
                <div key={member._id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isMe ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-gray-800/50 border border-transparent'}`}>
                  <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-xs shadow-lg border border-white/5 flex-shrink-0">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className={`text-xs font-bold truncate ${isMe ? 'text-indigo-400' : 'text-gray-200'}`}>
                      {member.username} {isMe && "(Sen)"}
                    </p>
                    <p className="text-[9px] text-gray-500 font-bold tracking-tighter">{member.karmaPoints} KARMA</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* SAĞ KOLON: SOHBET ODASI */}
      <main className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-screen relative bg-[#0a0f1c]">
        
        {/* SOHBET ÜST BARI */}
        <header className="px-8 py-5 border-b border-gray-800/80 bg-gray-900/80 backdrop-blur-xl z-10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Çalışma Odası
            </h2>
            <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">Sadece kabile üyeleri görebilir</p>
          </div>
          <div className="hidden md:flex -space-x-2">
            {hub?.members?.slice(0,3).map((m,i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400 z-10">{m.username[0].toUpperCase()}</div>
            ))}
            {hub?.members?.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400 z-0">+{hub.members.length - 3}</div>}
          </div>
        </header>

        {/* MESAJ AKIŞI */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-grid-slate-900/[0.04]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <span className="text-6xl opacity-20 drop-shadow-2xl">{hub?.icon}</span>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Bu kabilede sessizlik hakim. Sinerjiyi başlat!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.user === currentUser?._id;
              // Önceki mesajla aynı kişiyse ismi tekrar yazmamak için basit kontrol
              const showName = index === 0 || messages[index - 1].user !== msg.user;
              
              return (
                <div key={msg._id} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  {!isMe && showName && (
                    <span className="text-[10px] text-gray-500 mb-1 ml-2 font-bold tracking-widest uppercase">{msg.username}</span>
                  )}
                  <div className={`px-5 py-3.5 shadow-xl ${
                    isMe 
                    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm" 
                    : "bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-2xl rounded-tl-sm backdrop-blur-sm"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  </div>
                  <span className={`text-[9px] text-gray-600 mt-1.5 font-bold ${isMe ? "mr-1" : "ml-1"}`}>{formatDate(msg.createdAt)}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* MESAJ GÖNDERME KUTUSU */}
        <div className="p-4 md:p-6 border-t border-gray-800/80 bg-gray-900/90 backdrop-blur-xl">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`${hub?.name} kabilesine mesaj gönder...`}
              className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-full pl-6 pr-32 py-4 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-gray-800 transition-all shadow-inner"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              {isSending ? "..." : "Gönder"}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}