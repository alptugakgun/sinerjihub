"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

export default function MessagesPage() {
  const router = useRouter();
  const socket = useRef();
  const messagesEndRef = useRef(null);

  // --- TEMEL DURUMLAR ---
  const [user, setUser] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MESAJLAŞMA DURUMLARI ---
  const [activeChat, setActiveChat] = useState(null); // Seçili arkadaş nesnesi
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [arrivalMessage, setArrivalMessage] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- 1. SOCKET & GERÇEK ZAMANLI DİNLEYİCİLER ---
  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getDm", (data) => {
      setArrivalMessage({
        sender: data.sender,
        content: data.content,
        createdAt: Date.now(),
      });
      // Eğer mesajlaştığım kişi dışında birinden mesaj gelirse bildirim patlat
      if (activeChat?._id !== data.sender) {
         toast('Sinyal: Yeni bir DM aldın! 💬', {
            style: { borderRadius: '1rem', background: '#1f2937', color: '#fff', border: '1px solid #374151', fontSize: '12px', fontWeight: 'bold' },
         });
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [activeChat]);

  // Yeni mesaj geldiğinde aktif sohbete ekle
  useEffect(() => {
    if (arrivalMessage && activeChat && arrivalMessage.sender === activeChat._id) {
      setMessages((prev) => [...prev, arrivalMessage]);
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [arrivalMessage, activeChat]);

  // --- 2. VERİ ÇEKME MOTORU (KULLANICI VE ARKADAŞLAR) ---
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId || userId === "undefined") { router.push("/login"); return; }

      try {
        socket.current.emit("newUser", userId);

        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`, { credentials: "include" });
        const userData = await userRes.json();
        if (userRes.ok) { 
           setUser(userData); 
           
           // Arkadaş listesini (Ağındaki kişileri) detaylarıyla çek
           if (userData.friends && userData.friends.length > 0) {
              const friendsPromises = userData.friends.map(friendId => 
                 fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${friendId}`, { credentials: "include" }).then(res => res.json())
              );
              const friendsData = await Promise.all(friendsPromises);
              // undefined/hata dönenleri filtrele
              setFriendsList(friendsData.filter(f => f && !f.message));
           }
        } else { 
           router.push("/login"); return; 
        }
      } catch (error) { 
        console.error("Veri yüklenirken hata:", error); 
        toast.error("Bağlantı kurulamadı.");
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchUserData();
  }, [router]);

  // --- 3. SOHBET SEÇİMİ VE GEÇMİŞ MESAJLARI ÇEKME ---
  const handleSelectChat = async (friend) => {
    setActiveChat(friend);
    setMessages([]); // Yüklenirken temizle
    const userId = localStorage.getItem("userId");
    
    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/messages/between/${userId}/${friend._id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err) {
      console.error("Mesajlar yüklenemedi:", err);
      toast.error("Sohbet geçmişi alınamadı.");
    }
  };

  // --- 4. MESAJ GÖNDERME MOTORU ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    setIsSending(true);
    const userId = localStorage.getItem("userId");
    const messageContent = newMessage; // Göndermeden önce state'i temizlemek için kopyala
    
    // Soket ile anında karşıya fırlat
    socket.current.emit("sendDm", { senderId: userId, receiverId: activeChat._id, content: messageContent });
    
    // UI'a anında ekle (Optimistic UI)
    setMessages((prev) => [...prev, { sender: userId, content: messageContent, createdAt: Date.now() }]);
    setNewMessage("");
    setTimeout(() => scrollToBottom(), 50);

    // Veritabanına kaydet (Arka planda)
    try {
      await fetch("https://sinerjihub-1.onrender.com/api/messages/send", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId, receiverId: activeChat._id, content: messageContent }),
      });
    } catch (err) {
      console.error("Mesaj gönderilemedi:", err);
      toast.error("Mesaj iletilemedi!");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white flex-col">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">İletişim Merkezi Kuruluyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans bg-[#050505] text-white selection:bg-indigo-500/30">
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- SIDEBAR --- */}
      <aside className="w-24 md:w-72 bg-gray-900/40 border-r border-gray-800/50 flex flex-col p-4 md:p-8 backdrop-blur-2xl h-screen sticky top-0 z-20">
        <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 mb-12 tracking-tighter italic hidden md:block">SINERJIHUB</h1>
        <h1 className="text-xl font-black text-indigo-400 mb-12 text-center md:hidden italic">SH</h1>
        
        <nav className="flex-1 space-y-4">
          <Link href="/dashboard" className="flex items-center justify-center md:justify-start gap-4 text-gray-400 hover:bg-gray-800 px-2 md:px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:scale-110">🏠</span> <span className="font-medium text-sm hidden md:block">Ana Üs</span>
          </Link>
          <Link href="/explore" className="flex items-center justify-center md:justify-start gap-4 text-gray-400 hover:bg-gray-800 px-2 md:px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:scale-110">🧭</span> <span className="font-medium text-sm hidden md:block">Keşfet</span>
          </Link>
          <Link href="/messages" className="flex items-center justify-center md:justify-start gap-4 bg-indigo-600/10 px-2 md:px-5 py-4 rounded-2xl border border-indigo-500/20 group">
            <span className="text-xl">💬</span> <span className="font-bold text-sm text-white hidden md:block">Sinyaller</span>
          </Link>
          <Link href="/profile" className="flex items-center justify-center md:justify-start gap-4 text-gray-400 hover:bg-gray-800 px-2 md:px-5 py-4 rounded-2xl transition-all group">
            <span className="text-xl group-hover:rotate-12">👤</span> <span className="font-medium text-sm hidden md:block">Profil</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700/50 flex flex-col gap-4">
          <button onClick={() => { localStorage.removeItem("userId"); router.push("/login"); }} className="w-full text-red-500/70 text-[10px] font-black uppercase tracking-widest hover:text-red-400 py-3 transition-all hidden md:block">Sistemden Çık</button>
        </div>
      </aside>

      {/* --- İLETİŞİM MERKEZİ GÖVDESİ --- */}
      <main className="flex-1 flex h-screen bg-grid-slate-900/[0.04]">
        
        {/* KİŞİ LİSTESİ (CONTACTS) */}
        <section className={`w-full md:w-80 lg:w-96 border-r border-gray-800/50 flex flex-col bg-gray-900/20 backdrop-blur-sm ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-800/50">
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">Ağ (Bağlantılar)</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input type="text" placeholder="Gezgin ara..." className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-indigo-500/50 transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {friendsList.length === 0 ? (
               <div className="text-center py-10 opacity-50">
                  <span className="text-4xl block mb-3">📭</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ağında Kimse Yok</p>
                  <p className="text-xs text-gray-500 mt-2">Keşfet sayfasından yeni bağlar kur.</p>
               </div>
            ) : (
               friendsList.map(friend => (
                 <div 
                    key={friend._id} 
                    onClick={() => handleSelectChat(friend)}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeChat?._id === friend._id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-gray-800/40 border border-transparent'}`}
                 >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] flex-shrink-0">
                       <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center font-black text-lg overflow-hidden border border-gray-900">
                          {friend.profilePicture ? <img src={friend.profilePicture} className="w-full h-full object-cover"/> : friend.username[0].toUpperCase()}
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className={`text-sm font-black truncate ${activeChat?._id === friend._id ? 'text-indigo-400' : 'text-gray-200'}`}>{friend.username}</h4>
                       <p className="text-xs text-gray-500 truncate mt-0.5">{friend.bio || "SinerjiHub Gezgini"}</p>
                    </div>
                 </div>
               ))
            )}
          </div>
        </section>

        {/* SOHBET PENCERESİ (CHAT WINDOW) */}
        <section className={`flex-1 flex flex-col bg-[#070b14] relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 select-none">
              <span className="text-[100px] mb-6">🛰️</span>
              <h3 className="text-xl font-black tracking-widest uppercase text-gray-400">SİNYAL BEKLENİYOR</h3>
              <p className="text-sm font-medium text-gray-500 mt-2">İletişime geçmek için ağından birini seç.</p>
            </div>
          ) : (
            <>
              {/* SOHBET HEADER */}
              <header className="p-5 border-b border-gray-800/60 bg-gray-900/40 backdrop-blur-xl flex justify-between items-center z-10 shadow-md">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setActiveChat(null)} className="md:hidden w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">←</button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px]">
                       <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center font-black text-sm overflow-hidden border border-gray-900">
                          {activeChat.profilePicture ? <img src={activeChat.profilePicture} className="w-full h-full object-cover"/> : activeChat.username[0].toUpperCase()}
                       </div>
                    </div>
                    <div>
                       <h3 className="font-black text-white text-sm">{activeChat.username}</h3>
                       <span className="text-[10px] text-green-400 font-bold tracking-widest flex items-center gap-1 uppercase">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Ağa Bağlı
                       </span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {activeChat.socialLinks?.github && <a href={activeChat.socialLinks.github} target="_blank" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-colors">GH</a>}
                    <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-colors">⋮</button>
                 </div>
              </header>

              {/* MESAJLAR AKIŞI */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-grid-slate-900/[0.05]">
                 <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                       <div className="text-center py-10 bg-gray-800/20 border border-dashed border-gray-700 rounded-3xl mt-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">İlk adımı at ve bir sinyal fırlat.</p>
                       </div>
                    ) : (
                       messages.map((msg, idx) => {
                          const isMe = msg.sender === user?._id;
                          return (
                             <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                                <div className={`max-w-[85%] md:max-w-[70%] group`}>
                                   <div className={`px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-lg border transition-all ${isMe ? 'bg-indigo-600 border-indigo-500/50 text-white rounded-br-sm' : 'bg-gray-800 border-gray-700 text-gray-200 rounded-bl-sm'}`}>
                                      
                                      {/* MARKDOWN RENDER MOTORU (KOD BLOKLARI İÇİN) */}
                                      <ReactMarkdown
                                         components={{
                                            code({node, inline, className, children, ...props}) {
                                               return !inline ? (
                                                  <pre className="bg-gray-900/80 p-4 rounded-xl overflow-x-auto border border-gray-700/50 my-3 text-[11px] text-green-400 font-mono shadow-inner custom-scrollbar">
                                                     <code className={className} {...props}>{children}</code>
                                                  </pre>
                                               ) : (
                                                  <code className="bg-gray-900/80 border border-gray-700/50 px-1.5 py-0.5 rounded-md text-pink-300 font-mono text-[11px]" {...props}>{children}</code>
                                               )
                                            }
                                         }}
                                      >
                                         {msg.content}
                                      </ReactMarkdown>
                                      
                                   </div>
                                   <div className={`text-[9px] text-gray-500 font-black tracking-widest mt-2 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                      {formatDate(msg.createdAt)}
                                      {isMe && <span className="text-indigo-400">✓✓</span>}
                                   </div>
                                </div>
                             </div>
                          );
                       })
                    )}
                    <div ref={messagesEndRef} />
                 </div>
              </div>

              {/* MESAJ GİRİŞ ALANI */}
              <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-gray-900/60 backdrop-blur-xl border-t border-gray-800/50">
                 <div className="max-w-4xl mx-auto flex gap-3 relative">
                    <button type="button" className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex-shrink-0">📎</button>
                    <input 
                       type="text" 
                       value={newMessage} 
                       onChange={(e) => setNewMessage(e.target.value)} 
                       placeholder="Yazılım, projeler veya fikirler hakkında sinyal gönder... (Kod için ``` kullan)" 
                       className="flex-1 bg-gray-800/80 border border-gray-700 rounded-full pl-6 pr-16 py-3 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-gray-800 transition-all shadow-inner"
                       autoComplete="off"
                    />
                    <button 
                       type="submit" 
                       disabled={isSending || !newMessage.trim()} 
                       className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:opacity-50 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95"
                    >
                       {isSending ? "..." : "➤"}
                    </button>
                 </div>
              </form>
            </>
          )}
        </section>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}