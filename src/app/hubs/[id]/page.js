"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";

// --- YARDIMCI BİLEŞEN: DİĞER KULLANICILARIN (REMOTE) VİDEO OYNATICISI ---
const RemoteVideo = ({ stream, peerId }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full min-w-[280px] max-w-sm bg-black border-2 border-purple-500/30 rounded-[2.5rem] p-1.5 relative overflow-hidden aspect-video shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in duration-500">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-[2.2rem] transform scale-x-[-1] shadow-inner" />
      <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-xl border border-gray-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span> GEZGİN
      </div>
    </div>
  );
};

export default function HubRoomPage() {
  const params = useParams();
  const router = useRouter();
  const hubId = params.id;

  const socket = useRef();
  const peerInstance = useRef(null);
  const callsRef = useRef({});
  const localVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Kamerayı kopmalara karşı Ref içinde tutuyoruz
  const localStreamRef = useRef(null);

  // --- TEMEL DURUMLAR (STATES) ---
  const [user, setUser] = useState(null);
  const [hub, setHub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- DOSYA EKLEME (ATTACHMENT) DURUMLARI ---
  const [attachment, setAttachment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentType, setAttachmentType] = useState("");

  // --- MEDYA VE GERÇEK ZAMANLI İLETİŞİM DURUMLARI ---
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); 
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // --- 1. ARKA PLAN MOTORU VE SOCKET LISTENERS ---
  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getHubMessage", (data) => {
      setMessages((prev) => [...prev, data]);
      setTimeout(() => scrollToBottom(), 100);
    });

    socket.current.on("user-connected-voice", (peerId) => {
      toast.success("🎙️ Canlı ağa yeni bir gezgin katıldı!", {
        style: { borderRadius: '1rem', background: '#1e1b4b', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
      });
      
      if (localStreamRef.current && peerInstance.current) {
        connectToNewUser(peerId, localStreamRef.current);
      }
    });

    return () => {
      if (socket.current) socket.current.disconnect();
      if (peerInstance.current) peerInstance.current.destroy();
    };
  }, []); 

  // --- 2. VERİ ÇEKME VE ODAYA GİRİŞ ETKİSİ ---
  useEffect(() => {
    const fetchHubAndUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId || userId === "undefined") {
        router.push("/login");
        return;
      }

      try {
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        const userData = await userRes.json();
        if (userRes.ok) {
          setUser(userData);
        } else {
          router.push("/login");
          return;
        }

        const hubRes = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/all`);
        const allHubs = await hubRes.json();
        const currentHub = allHubs.find((h) => h._id === hubId);
        
        if (currentHub) {
          setHub(currentHub);
          socket.current.emit("joinHubRoom", hubId);
          socket.current.emit("newUser", userId);

          if (currentHub.messages) {
            setMessages(currentHub.messages);
          }
          setTimeout(() => scrollToBottom(), 300);
        } else {
          toast.error("Hata: Kabile ekosistemde mevcut değil.");
          router.push("/dashboard");
        }
      } catch (err) {
        toast.error("Bağlantı hatası!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHubAndUserData();
  }, [hubId, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- 3. DOSYA SEÇME VE BASE64 FORMATINA ÇEVİRME MOTORU ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu çok büyük! Maksimum 5MB fırlatabilirsin.", {
        style: { background: '#7f1d1d', color: '#fff' }
      });
      return;
    }

    setAttachmentName(file.name);
    setAttachmentType(file.type);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setAttachment(reader.result);
      toast.success("Dosya sinyal kuyruğuna eklendi! 📎", {
        style: { background: '#1f2937', color: '#fff' }
      });
    };
  };

  // --- 4. PEERJS VE WEBRTC CANLI MEDYA BAĞLANTI MOTORLARI ---
  const handleStartVoiceNetwork = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      localStreamRef.current = stream; 

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const { default: Peer } = await import("peerjs");
      
      const peer = new Peer(); 
      peerInstance.current = peer;

      peer.on("open", (id) => {
        socket.current.emit("join-voice-room", { hubId, peerId: id });
        toast.success("⚡ Sinerji Canlı İletişim Ağı Aktif! Kamera açıldı.");
      });

      peer.on("call", (call) => {
        call.answer(stream); 
        call.on("stream", (userVideoStream) => {
          addRemoteStream(call.peer, userVideoStream);
        });
        
        call.on("close", () => {
          removeRemoteStream(call.peer);
        });
        
        callsRef.current[call.peer] = call;
      });

    } catch (err) {
      toast.error("Kamera izni alınamadı! Lütfen adres çubuğundaki kilit (🔒) simgesinden izin ver dostum.");
    }
  };

  const connectToNewUser = (peerId, stream) => {
    if (!peerInstance.current) return;
    
    const call = peerInstance.current.call(peerId, stream);
    
    call.on("stream", (userVideoStream) => {
      addRemoteStream(peerId, userVideoStream);
    });
    
    call.on("close", () => {
      removeRemoteStream(peerId);
    });

    callsRef.current[peerId] = call;
  };

  const addRemoteStream = (peerId, stream) => {
    setRemoteStreams((prev) => {
      if (prev.some((s) => s.peerId === peerId)) return prev;
      return [...prev, { peerId, stream }];
    });
  };

  const removeRemoteStream = (peerId) => {
    setRemoteStreams((prev) => prev.filter((s) => s.peerId !== peerId));
  };

  // --- YENİ EKLENEN/GÜNCELLENEN: KUSURSUZ EKRAN PAYLAŞIMI MOTORU ---
  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = screenStream.getVideoTracks()[0];
      
      // 1. Ekranı yerel (kendi) penceremize yansıtıyoruz
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
      
      // 2. Ekran akışını (track) anında odadaki diğer gezginlere zorla fırlatıyoruz (Sihirli Kısım)
      if (peerInstance.current) {
        const connections = peerInstance.current.connections;
        Object.keys(connections).forEach((peerId) => {
          connections[peerId].forEach((conn) => {
            if (conn.peerConnection) {
              const sender = conn.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
            }
          });
        });
      }
      
      // 3. Kullanıcı "Paylaşımı Durdur" dediğinde eski kameraya geri dönme senaryosu
      videoTrack.onended = () => {
        if (localStreamRef.current && localVideoRef.current) {
          // Kendi ekranımıza kamerayı geri veriyoruz
          localVideoRef.current.srcObject = localStreamRef.current;
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          
          // Odaya tekrar eski kameramızı fırlatıyoruz
          if (peerInstance.current) {
            const conns = peerInstance.current.connections;
            Object.keys(conns).forEach((peerId) => {
              conns[peerId].forEach((conn) => {
                if (conn.peerConnection) {
                  const sender = conn.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
                  if (sender) {
                    sender.replaceTrack(oldVideoTrack);
                  }
                }
              });
            });
          }
        }
        setIsScreenSharing(false);
      };
      
      toast.success("🖥️ Ekran paylaşımı sinyali tüm kabileye aktarılıyor!");
    } catch (err) {
      console.error("Ekran paylaşılamadı:", err);
      toast.error("Ekran paylaşılamadı veya iptal edildi.");
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
      setIsCamOff(!isCamOff);
    }
  };

  // --- 5. MESAJ VE SİNYAL GÖNDERME FONKSİYONU ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!textInput.trim() && !attachment) return;

    setIsSending(true);
    const msgData = {
      hubId,
      senderId: user?._id,
      username: user?.username,
      content: textInput,
      attachment,
      attachmentName,
      attachmentType,
    };

    socket.current.emit("sendHubMessage", msgData);
    setMessages((prev) => [...prev, { ...msgData, createdAt: Date.now(), user: user?._id }]);
    
    setTextInput("");
    setAttachment("");
    setAttachmentName("");
    setAttachmentType("");
    
    setTimeout(() => scrollToBottom(), 50);
    setIsSending(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white flex-col">
      <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
      <p className="text-blue-500 font-black tracking-[0.3em] uppercase text-[10px] animate-pulse">Kabile Kapısı Açılıyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-blue-500/30">
      <Toaster position="top-center" />

      {/* --- SOL PANEL: KABİLE DETAYLARI VE ÜYE HİYERARŞİSİ --- */}
      <aside className="w-full md:w-80 bg-[#0c1222]/95 border-r border-gray-800/60 p-6 flex flex-col backdrop-blur-3xl z-10 select-none shadow-2xl">
        <Link href="/dashboard" className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-10 group transition-all">
          <span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center group-hover:-translate-x-1 transition-transform">←</span> 
          Ana Üsse Dön
        </Link>

        {/* KABİLE KİMLİK KARTI */}
        <div className="text-center mb-10 bg-gradient-to-b from-gray-800/10 to-transparent border border-gray-800/40 p-8 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <span className="text-6xl mb-4 block drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{hub?.icon}</span>
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">{hub?.name}</h2>
          <span className="inline-block bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
            {hub?.category}
          </span>
          <p className="text-[11px] text-gray-500 mt-5 leading-relaxed font-medium px-2">{hub?.description}</p>
        </div>

        {/* KABİLE ÜYELERİ LİSTESİ */}
        <div className="flex-1 flex flex-col min-h-[250px]">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-6 px-2 flex justify-between items-center border-b border-gray-800 pb-3">
            <span>KABİLE ÜYELERİ</span>
            <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md text-[8px]">{hub?.members?.length || 1}</span>
          </h3>
          
          <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex items-center gap-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-2xl group hover:bg-blue-600/20 transition-all">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm overflow-hidden border-2 border-blue-500/20">
                {user?.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user?.username?.[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tighter">{user?.username} <span className="text-[9px] text-blue-400/70 ml-1">(Sen)</span></p>
                <p className="text-[9px] text-blue-400 font-black tracking-widest mt-0.5">{user?.karmaPoints || 0} KARMA</p>
              </div>
            </div>
          </div>
        </div>

        {/* CANLI BAĞLANTI TETİKLEYİCİSİ */}
        <div className="mt-auto pt-6 border-t border-gray-800/40">
          <button 
            onClick={handleStartVoiceNetwork} 
            disabled={localStream !== null}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-green-600 disabled:opacity-100 text-white font-black py-4 rounded-[1.2rem] text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <span className="text-lg">🎙️</span> {localStream ? "AĞA BAĞLISIN" : "CANLI AĞI BAŞLAT"}
          </button>
        </div>
      </aside>

      {/* --- SAĞ PANEL: CANLI MEDYA VE SİNERJİ İLETİŞİM AKIŞI --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-[#070b14] bg-grid-slate-900/[0.05]">
        
        {/* ÜST BAR VE MEDYA KONTROLLERİ */}
        <div className="p-6 border-b border-gray-800/60 bg-[#0c1222]/80 backdrop-blur-xl flex justify-between items-center z-20 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-gray-200">
              Sinerji İletişim Ağı
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {localStream && (
              <div className="flex gap-2 mr-4 border-r border-gray-800 pr-4">
                <button onClick={toggleMute} className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isMuted ? "bg-red-600/20 border-red-500 text-red-400" : "bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white"}`} title="Mikrofon">
                  {isMuted ? "🔇 Kapalı" : "🎙️ Açık"}
                </button>
                <button onClick={toggleCamera} className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isCamOff ? "bg-red-600/20 border-red-500 text-red-400" : "bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white"}`} title="Kamera">
                  {isCamOff ? "📹 Kapalı" : "📹 Açık"}
                </button>
                <button onClick={handleScreenShare} className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isScreenSharing ? "bg-blue-600 text-white border-transparent" : "bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white"}`} title="Ekran Paylaş">
                   🖥️ Ekran
                </button>
              </div>
            )}
            <button 
              onClick={() => router.push('/dashboard')} 
              className="bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-transparent text-red-500 hover:text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
            >
              BAĞLANTIYI KES
            </button>
          </div>
        </div>

        {/* ANA GÖVDE: MEDYA EKRANLARI VE MESAJ AKIŞI */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar flex flex-col">
          
          {/* WEBRTC ÇOKLU VİDEO EKRANLARI (GRID MANTIKLI) */}
          <div className="flex flex-wrap justify-center gap-6 w-full">
            {/* 1. LOKAL VİDEO EKRANI (SEN) */}
            {localStream && !isCamOff && (
              <div className="w-full min-w-[280px] max-w-sm bg-black border-2 border-blue-500/20 rounded-[2.5rem] p-1.5 relative overflow-hidden aspect-video shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in duration-500">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-[2.2rem] transform scale-x-[-1] shadow-inner" 
                />
                <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-xl border border-gray-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Ben
                </div>
                {isScreenSharing && (
                  <div className="absolute top-5 right-5 bg-blue-600 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest animate-bounce">
                    YAYINDA
                  </div>
                )}
              </div>
            )}

            {/* 2. DİĞER KULLANICILAR (REMOTE STREAMS) PEERJS ÜZERİNDEN GELENLER */}
            {remoteStreams.map((remote) => (
              <RemoteVideo key={remote.peerId} peerId={remote.peerId} stream={remote.stream} />
            ))}
          </div>

          {/* SİNERJİ MESAJLAŞMA AKIŞI */}
          <div className="space-y-6 flex-1 max-w-5xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/20 border border-dashed border-gray-800 rounded-[3rem]">
                <p className="text-gray-600 text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-50">Sinerji Dalgası Bekleniyor</p>
                <p className="text-[10px] text-gray-700 uppercase font-bold">Kabileni harekete geçirecek ilk sinyali sen fırlat!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user?._id || msg.user === user?._id;
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <span className="text-[9px] text-gray-600 font-black uppercase mb-2 px-2 tracking-widest">@{msg.username}</span>
                    
                    <div className={`max-w-[85%] px-5 py-4 rounded-[1.8rem] text-sm leading-relaxed font-medium shadow-xl border transition-all ${isMe ? "bg-blue-600 border-transparent text-white rounded-tr-none" : "bg-gray-800/60 border-gray-700 text-gray-200 rounded-tl-none hover:bg-gray-800/80"}`}>
                      {msg.content}

                      {/* DOSYA EKİ GÖSTERİMİ */}
                      {msg.attachment && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                          {msg.attachmentType?.startsWith("image/") ? (
                            <img src={msg.attachment} className="max-w-full rounded-2xl border border-white/10 shadow-lg" alt="Ek" />
                          ) : (
                            <a href={msg.attachment} download={msg.attachmentName} className="text-[10px] font-black uppercase bg-black/40 px-4 py-3 rounded-xl block text-center border border-white/5 hover:bg-black/60 tracking-[0.2em] transition-all">
                              📁 {msg.attachmentName || "BELGEYİ İNDİR"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ALT PANEL: METİN VE DOSYA GİRİŞ MERKEZİ */}
        <form onSubmit={handleSendMessage} className="p-8 border-t border-gray-800/60 bg-[#0c1222]/90 backdrop-blur-2xl z-20">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            
            {/* DOSYA KUYRUĞU GÖSTERGESİ */}
            {attachmentName && (
              <div className="bg-blue-950/40 border border-blue-500/30 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 flex justify-between items-center animate-in slide-in-from-bottom-4">
                <span className="flex items-center gap-3">📎 Kuyruktaki Sinyal: <strong className="text-white">{attachmentName}</strong></span>
                <button type="button" onClick={() => { setAttachment(""); setAttachmentName(""); }} className="bg-red-500/20 text-red-400 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">×</button>
              </div>
            )}

            <div className="flex gap-4 relative">
              <label className="bg-gray-800/60 hover:bg-gray-700 text-gray-500 hover:text-blue-400 px-5 flex items-center justify-center rounded-[1.3rem] border border-gray-700 cursor-pointer transition-all shadow-inner group">
                <span className="text-xl group-hover:scale-110 transition-transform">📎</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
              </label>

              <input 
                type="text" 
                value={textInput} 
                onChange={(e) => setTextInput(e.target.value)} 
                placeholder="Kabileye anlık sinyal gönder veya dosya fırlat..." 
                className="flex-1 bg-gray-900/60 border border-gray-800 rounded-[1.3rem] pl-7 pr-32 py-5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-gray-800/40 transition-all font-medium placeholder-gray-600 shadow-inner"
                autoComplete="off"
              />
              
              <button 
                type="submit" 
                disabled={isSending || (!textInput.trim() && !attachment)} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:opacity-50 text-white font-black px-8 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
              >
                {isSending ? "..." : "SİNYAL"}
              </button>
            </div>
          </div>
        </form>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}