"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { Toaster, toast } from "react-hot-toast";

export default function HubDetailPage() {
  const { id: hubId } = useParams();
  const router = useRouter();

  // --- TEMEL DURUMLAR (STATES) ---
  const [hub, setHub] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- DOSYA / GÖRSEL PAYLAŞIMI DURUMU ---
  const [attachment, setAttachment] = useState(null);

  // --- GÖRÜNTÜLÜ SOHBET VE EKRAN PAYLAŞIMI DURUMLARI ---
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [peerStreams, setPeerStreams] = useState([]);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false); // YENİ EKLENDİ

  // --- REFERANSLAR ---
  const messagesEndRef = useRef(null);
  const socket = useRef(); 
  const peer = useRef();
  const myVideoRef = useRef(); 

  // Her yeni mesajda en alta kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- SOCKET VE PEER BAĞLANTILARI ---
  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getHubMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.current.on("user-connected-voice", (peerId) => {
      if (myStream && peer.current) {
        connectToNewUser(peerId, myStream);
      }
    });

    return () => {
      socket.current.disconnect();
      if (peer.current) peer.current.destroy();
      if (myStream) myStream.getTracks().forEach(track => track.stop());
    };
  }, [myStream]);

  // --- VERİ ÇEKME İŞLEMİ ---
  useEffect(() => {
    const fetchHubData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) { router.push("/login"); return; }

      try {
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);

          if (!userData.hubs.includes(hubId)) {
            toast.error("Bu çalışma odasına girmek için kabileye katılmalısın dostum!", { style: { background: '#7f1d1d', color: '#fff' } });
            router.push("/dashboard");
            return;
          }
          socket.current.emit("joinHubRoom", hubId);
        } else {
          router.push("/login"); return;
        }

        const hubRes = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}`);
        if (hubRes.ok) setHub(await hubRes.json());

        const messagesRes = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}/messages`);
        if (messagesRes.ok) setMessages(await messagesRes.json());

      } catch (error) {
        console.error("Kabile verileri çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHubData();
  }, [hubId, router]);

  // --- DOSYA SEÇME VE BASE64 DÖNÜŞTÜRME ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
      toast.error("Sıfır bütçe kuralları! Dosya boyutu 2MB'den küçük olmalı.", { style: { background: '#7f1d1d', color: '#fff' } });
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        data: reader.result,
        name: file.name,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // --- MESAJ VE DOSYA GÖNDERME ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    
    setIsSending(true);
    const userId = localStorage.getItem("userId");

    const payload = {
      hubId: hubId,
      senderId: userId,
      username: currentUser?.username || "Gezgin",
      content: newMessage,
      attachment: attachment?.data || null,
      attachmentName: attachment?.name || null,
      attachmentType: attachment?.type || null
    };

    socket.current.emit("sendHubMessage", payload);

    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}/messages/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...payload }),
      });

      if (res.ok) {
        const savedMessage = await res.json();
        setMessages((prev) => [...prev.filter(m => m._id), savedMessage]);
        setNewMessage("");
        setAttachment(null);
      }
    } catch (err) { 
        toast.error("Sunucuyla bağlantı hatası oluştu.", { style: { background: '#7f1d1d', color: '#fff' } });
    }
    setIsSending(false);
  };

  // --- WEBRTC GÖRÜNTÜLÜ SOHBET BAŞLATMA ---
  const startVoiceAndVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        setIsVoiceActive(true);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;

        const newPeer = new Peer(undefined, { host: '0.peerjs.com', port: 443, secure: true });
        peer.current = newPeer;

        newPeer.on('open', (id) => {
          socket.current.emit('join-voice-room', { hubId, peerId: id });
          toast.success("Odaya bağlandın!", { style: { background: '#1f2937', color: '#fff' } });
        });

        newPeer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userVideoStream) => {
            addVideoStream(call.peer, userVideoStream);
          });
        });
      })
      .catch(err => {
        toast.error("Kamera veya mikrofona erişilemedi! İzin verdiğinden emin ol.", { style: { background: '#7f1d1d', color: '#fff' } });
      });
  };

  // --- YENİ EKLENEN: EKRAN PAYLAŞIMI FONKSİYONLARI ---
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        // Kendi ekranımda kameram yerine paylaştığım ekranı göster
        if (myVideoRef.current) myVideoRef.current.srcObject = displayStream;

        // Bağlı olan tüm kullanıcılara kamera verisi yerine ekran verisini yolla (Track Replacement)
        if (peer.current && peer.current.connections) {
          Object.values(peer.current.connections).forEach(conns => {
            conns.forEach(conn => {
              if (conn.peerConnection) {
                const sender = conn.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
              }
            });
          });
        }
        setIsScreenSharing(true);
        toast.success("Ekran paylaşımı başlatıldı!", { style: { background: '#1f2937', color: '#fff' } });

        // Kullanıcı tarayıcının kendi "Paylaşımı Durdur" butonuna basarsa
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        toast.error("Ekran paylaşımı başlatılamadı veya iptal edildi.", { style: { background: '#7f1d1d', color: '#fff' } });
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (myStream) {
      const camTrack = myStream.getVideoTracks()[0];
      
      // Tekrar eski kamera görüntümüze dön
      if (myVideoRef.current) myVideoRef.current.srcObject = myStream;
      
      // Diğer kullanıcılara giden ekran verisini kesip kamerayı geri ver
      if (peer.current && peer.current.connections) {
        Object.values(peer.current.connections).forEach(conns => {
          conns.forEach(conn => {
            if (conn.peerConnection) {
              const sender = conn.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender) sender.replaceTrack(camTrack);
            }
          });
        });
      }
    }
    setIsScreenSharing(false);
    toast.success("Kamera görüntüsüne dönüldü.", { style: { background: '#1f2937', color: '#fff' } });
  };

  // --- PEER BAĞLANTI YARDIMCILARI ---
  const connectToNewUser = (peerId, stream) => {
    if (!peer.current) return;
    const call = peer.current.call(peerId, stream);
    call.on('stream', (userVideoStream) => {
      addVideoStream(peerId, userVideoStream);
    });
  };

  const addVideoStream = (peerId, stream) => {
    setPeerStreams(prev => {
      if (prev.some(p => p.peerId === peerId)) return prev;
      return [...prev, { peerId, stream }];
    });
  };

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks()[0].enabled = isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleAudio = () => {
    if (myStream) {
      myStream.getAudioTracks()[0].enabled = isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const leaveVoiceRoom = () => {
    if (myStream) myStream.getTracks().forEach(track => track.stop());
    if (isScreenSharing) stopScreenShare(); // Ekran paylaşımı açıksa onu da kapat
    if (peer.current) peer.current.destroy();
    setIsVoiceActive(false);
    setPeerStreams([]);
    setMyStream(null);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white flex-col">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-bold tracking-widest uppercase text-[10px]">Kabile Bağlantısı Kuruluyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col md:flex-row font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      <Toaster position="top-center" reverseOrder={false} />

      {/* SOL PANEL: ODA BİLGİLERİ VE ÜYELER */}
      <aside className="w-full md:w-80 bg-gray-800/40 border-r border-gray-700/50 flex flex-col p-6 backdrop-blur-2xl md:h-screen z-20">
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
          {hub?.isPrivate && <div className="mt-3 text-[10px] text-red-400 font-black tracking-widest border border-red-500/30 bg-red-500/10 py-1 rounded-md uppercase">🔒 Şifreli Özel Kabile</div>}
          <p className="text-xs text-gray-400 mt-5 leading-relaxed font-medium">{hub?.description}</p>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex justify-between items-center">
            Kabiledeki Üyeler
            <span className="bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded-md text-[9px]">{hub?.members?.length || 0}</span>
          </h3>
          <div className="space-y-2">
            {hub?.members?.map(member => {
              const isMe = member._id === currentUser?._id;
              return (
                <div key={member._id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isMe ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-gray-800/50 border border-transparent'}`}>
                  <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-xs shadow-lg flex-shrink-0 overflow-hidden">
                    {member.profilePicture ? <img src={member.profilePicture} className="w-full h-full object-cover" /> : member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className={`text-xs font-bold truncate ${isMe ? 'text-indigo-400' : 'text-gray-200'}`}>{member.username} {isMe && "(Sen)"}</p>
                    <p className="text-[9px] text-gray-500 font-bold tracking-tighter">{member.karmaPoints} KARMA</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* SAĞ PANEL: SOHBET VE KAMERA/EKRAN PAYLAŞIM ALANI */}
      <main className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-screen relative bg-[#0a0f1c]">
        
        <header className="px-8 py-5 border-b border-gray-800/80 bg-gray-900/80 backdrop-blur-xl z-10 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sinerji İletişim Ağı
            </h2>
          </div>
          {!isVoiceActive ? (
            <button onClick={startVoiceAndVideo} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2">
              <span>🎙️</span> Canlı Bağlantıya Katıl
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 p-1.5 rounded-full">
              <button onClick={toggleAudio} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAudioMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} title="Mikrofonu Aç/Kapat">{isAudioMuted ? '🔇' : '🎤'}</button>
              <button onClick={toggleVideo} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isVideoMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} title="Kamerayı Aç/Kapat">{isVideoMuted ? '📵' : '📹'}</button>
              
              {/* YENİ: EKRAN PAYLAŞIMI BUTONU */}
              <button onClick={toggleScreenShare} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} title="Ekranı Paylaş">
                {isScreenSharing ? '🖥️' : '💻'}
              </button>

              <div className="w-[1px] h-6 bg-gray-600 mx-2"></div>
              <button onClick={leaveVoiceRoom} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Bağlantıyı Kes</button>
            </div>
          )}
        </header>

        {/* KAMERA VE EKRAN PAYLAŞIM IZGARASI */}
        {isVoiceActive && (
          <div className="w-full bg-gray-900/60 border-b border-gray-800 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto min-h-[200px] max-h-[300px]">
            <div className={`relative bg-black rounded-2xl overflow-hidden aspect-video shadow-lg border-2 ${isScreenSharing ? 'border-green-500' : 'border-indigo-500'}`}>
              <video ref={myVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted && !isScreenSharing ? 'opacity-0' : 'opacity-100'}`} />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[9px] font-bold">
                {isScreenSharing ? "Ben (Ekran Yayını)" : "Ben"}
              </div>
              {isVideoMuted && !isScreenSharing && <div className="absolute inset-0 flex items-center justify-center text-4xl">👤</div>}
            </div>
            {peerStreams.map((peerObj, index) => (
              <VideoPlayer key={index} stream={peerObj.stream} peerId={peerObj.peerId} />
            ))}
          </div>
        )}

        {/* MESAJ VE DOSYA AKIŞI */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6 custom-scrollbar bg-grid-slate-900/[0.04]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <span className="text-6xl opacity-20 drop-shadow-2xl">{hub?.icon}</span>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Bu odada henüz sinerji parlamadı. İlk mesajı sen gönder!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.user === currentUser?._id;
              const showName = index === 0 || messages[index - 1].user !== msg.user;
              
              return (
                <div key={msg._id || index} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  {!isMe && showName && <span className="text-[10px] text-gray-500 mb-1 ml-2 font-bold tracking-widest uppercase">{msg.username}</span>}
                  
                  <div className={`px-5 py-3.5 shadow-xl flex flex-col gap-2 ${isMe ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm" : "bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-2xl rounded-tl-sm backdrop-blur-sm"}`}>
                    
                    {/* GÖRSEL VEYA DOSYA RENDER ALANI */}
                    {msg.attachment && (
                      msg.attachmentType?.startsWith('image/') ? (
                        <img src={msg.attachment} alt="Sinerji Görseli" className="max-w-full rounded-lg max-h-64 object-cover border border-white/10" />
                      ) : (
                        <a href={msg.attachment} download={msg.attachmentName} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}>
                           📄 {msg.attachmentName}
                        </a>
                      )
                    )}
                    
                    {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>}
                  </div>
                  <span className={`text-[9px] text-gray-600 mt-1.5 font-bold ${isMe ? "mr-1" : "ml-1"}`}>{formatTime(msg.createdAt)}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* YAZILI MESAJ VE DOSYA GİRİŞ PANELİ */}
        <div className="p-4 md:p-6 border-t border-gray-800/80 bg-gray-900/90 backdrop-blur-xl flex flex-col gap-3">
          
          {attachment && (
             <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl max-w-fit animate-in fade-in slide-in-from-bottom-2">
                <span className="text-xl">{attachment.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                <span className="text-xs font-bold text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-300 font-black ml-2">✖</button>
             </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl w-full mx-auto relative items-center">
            
            <label className="cursor-pointer bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors w-12 h-12 flex items-center justify-center rounded-full text-xl flex-shrink-0 shadow-inner">
               📎
               <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
            </label>

            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`${hub?.name || 'Kabile'} odasına fikir fırlat...`} className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-full px-6 py-4 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-gray-800 transition-all shadow-inner" autoComplete="off" />
            
            <button type="submit" disabled={isSending || (!newMessage.trim() && !attachment)} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 h-12 font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              {isSending ? "..." : "Fırlat"}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}

// React Component for Video rendering
const VideoPlayer = ({ stream, peerId }) => {
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return (
    <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 aspect-video shadow-lg">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[9px] font-bold text-white truncate max-w-[80%]">Sinerji Üyesi</div>
    </div>
  );
};