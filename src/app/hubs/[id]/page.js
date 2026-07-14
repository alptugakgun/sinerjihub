"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import Editor from "@monaco-editor/react";

// --- YARDIMCI BİLEŞEN: DİĞER KULLANICILARIN (REMOTE) VİDEO OYNATICISI ---
const RemoteVideo = ({ stream, peerId }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full min-w-[280px] max-w-sm bg-[#02001a] border-2 border-[#DE7A00]/30 rounded-2xl p-1.5 relative overflow-hidden aspect-video shadow-xl animate-in fade-in zoom-in duration-500">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl transform scale-x-[-1] shadow-inner" />
      <div className="absolute bottom-4 left-4 bg-[#030027]/80 backdrop-blur-md border border-[#F2F3D9]/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#F2F3D9] flex items-center gap-2">
        <span className="w-2 h-2 bg-[#DE7A00] rounded-full animate-pulse"></span> GEZGİN
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
  const localStreamRef = useRef(null);

  // --- TEMEL DURUMLAR (STATES) ---
  const [user, setUser] = useState(null);
  const [hub, setHub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- DOSYA EKLEME ---
  const [attachment, setAttachment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentType, setAttachmentType] = useState("");

  // --- MEDYA DURUMLARI ---
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); 
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // --- GERÇEK ZAMANLI KOD LABORATUVARI (LIVE IDE) DURUMLARI ---
  const [isIdeOpen, setIsIdeOpen] = useState(false);
  const [liveCode, setLiveCode] = useState("// SinerjiHub Ortak Kod Laboratuvarı Başlatıldı...\n// Ekibinizle aynı anda mimariyi burada tasarlayabilirsiniz.\n\n");
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState("");
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false); // Arşiv paneli durumu

  // --- 1. ARKA PLAN MOTORU VE SOCKET LISTENERS ---
  useEffect(() => {
    socket.current = io("https://sinerjihub-1.onrender.com");

    socket.current.on("getHubMessage", (data) => {
      setMessages((prev) => [...prev, data]);
      setTimeout(() => scrollToBottom(), 100);
    });

    socket.current.on("receiveCodeUpdate", (newCode) => {
      setLiveCode(newCode);
    });

    socket.current.on("user-connected-voice", (peerId) => {
      toast.success("🎙️ Canlı ağa yeni bir profesyonel katıldı!", {
        style: { borderRadius: '0.5rem', background: '#030027', color: '#F2F3D9', border: '1px solid #DE7A00', fontSize: '12px', fontWeight: 'bold' }
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
      if (!userId || userId === "undefined") { router.push("/login"); return; }

      try {
        const userRes = await fetch(`https://sinerjihub-1.onrender.com/api/auth/user/${userId}`, { credentials: "include" });
        const userData = await userRes.json();
        if (userRes.ok) { setUser(userData); } else { router.push("/login"); return; }

        const hubRes = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/all`, { credentials: "include" });
        const allHubs = await hubRes.json();
        const currentHub = allHubs.find((h) => h._id === hubId);
        
        if (currentHub) {
          setHub(currentHub);
          socket.current.emit("joinHubRoom", hubId);
          socket.current.emit("newUser", userId);

          if (currentHub.messages) { setMessages(currentHub.messages); }
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

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  // --- CANLI KOD SENKRONİZASYONU VE KAYIT MANTIĞI ---
  const handleEditorChange = (value) => {
    const updatedCode = value || "";
    setLiveCode(updatedCode);
    socket.current.emit("sendCodeUpdate", { hubId, code: updatedCode });
  };

  const handleSaveSnippet = async (e) => {
    e.preventDefault();
    if (!liveCode.trim()) return;
    setIsSavingCode(true);

    try {
      const res = await fetch(`https://sinerjihub-1.onrender.com/api/hubs/${hubId}/code/save`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          code: liveCode,
          title: snippetTitle || "İsimsiz Kod Bloğu"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Kod başarıyla arşive kaydedildi!", { style: { background: '#005700', color: '#F2F3D9' } });
        setHub(prev => ({ ...prev, codeSnippets: [...(prev.codeSnippets || []), data.snippet] }));
        setShowSnippetModal(false);
        setSnippetTitle("");
      } else {
        toast.error("Kod kaydedilemedi.");
      }
    } catch (error) {
      toast.error("Bağlantı hatası!");
    } finally {
      setIsSavingCode(false);
    }
  };

  // --- DOSYA SEÇME ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu maksimum 5MB olmalı.", { style: { background: '#520000', color: '#F2F3D9' } });
      return;
    }
    setAttachmentName(file.name);
    setAttachmentType(file.type);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setAttachment(reader.result);
      toast.success("Dosya kuyruğa eklendi! 📎", { style: { background: '#005700', color: '#F2F3D9' } });
    };
  };

  // --- WEBRTC CANLI MEDYA AĞI ---
  const handleStartVoiceNetwork = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream; 

      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; }

      const { default: Peer } = await import("peerjs");
      const peer = new Peer(); 
      peerInstance.current = peer;

      peer.on("open", (id) => {
        socket.current.emit("join-voice-room", { hubId, peerId: id });
        toast.success("⚡ Bağlantı Kuruldu! Kamera açıldı.", { style: { background: '#005700', color: '#F2F3D9' } });
      });

      peer.on("call", (call) => {
        call.answer(stream); 
        call.on("stream", (userVideoStream) => { addRemoteStream(call.peer, userVideoStream); });
        call.on("close", () => { removeRemoteStream(call.peer); });
        callsRef.current[call.peer] = call;
      });

    } catch (err) { toast.error("Kamera izni reddedildi."); }
  };

  const connectToNewUser = (peerId, stream) => {
    if (!peerInstance.current) return;
    const call = peerInstance.current.call(peerId, stream);
    call.on("stream", (userVideoStream) => { addRemoteStream(peerId, userVideoStream); });
    call.on("close", () => { removeRemoteStream(peerId); });
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

  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = screenStream.getVideoTracks()[0];
      
      if (localVideoRef.current) { localVideoRef.current.srcObject = screenStream; }
      setIsScreenSharing(true);
      
      if (peerInstance.current) {
        const connections = peerInstance.current.connections;
        Object.keys(connections).forEach((peerId) => {
          connections[peerId].forEach((conn) => {
            if (conn.peerConnection) {
              const sender = conn.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
              if (sender) { sender.replaceTrack(videoTrack); }
            }
          });
        });
      }
      
      videoTrack.onended = () => {
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          
          if (peerInstance.current) {
            const conns = peerInstance.current.connections;
            Object.keys(conns).forEach((peerId) => {
              conns[peerId].forEach((conn) => {
                if (conn.peerConnection) {
                  const sender = conn.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
                  if (sender) { sender.replaceTrack(oldVideoTrack); }
                }
              });
            });
          }
        }
        setIsScreenSharing(false);
      };
      
      toast.success("🖥️ Ekran paylaşımı kabileye aktarılıyor!");
    } catch (err) { toast.error("Ekran paylaşılamadı."); }
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

  // --- MESAJ GÖNDERME ---
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
    
    setTextInput(""); setAttachment(""); setAttachmentName(""); setAttachmentType("");
    setTimeout(() => scrollToBottom(), 50);
    setIsSending(false);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) return (
    <div className="min-h-screen bg-[#030027] flex items-center justify-center text-[#F2F3D9] flex-col">
      <div className="w-12 h-12 border-4 border-[#DE7A00] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Odaya Bağlanılıyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030027] text-[#F2F3D9] font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-[#DE7A00]/30">
      <Toaster position="top-center" />

      {/* SNIPPET KAYDETME MODALI */}
      {showSnippetModal && (
        <div className="fixed inset-0 bg-[#030027]/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-[#02001a] border border-[#DE7A00]/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2">Kodu Arşive Kaydet</h3>
            <p className="text-[11px] text-[#F2F3D9]/60 mb-6">Bu kod bloğu kabilenin hafızasına eklenecek.</p>
            <form onSubmit={handleSaveSnippet} className="space-y-4">
              <input type="text" value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} className="w-full bg-[#030027] border border-[#F2F3D9]/20 rounded-xl p-4 text-sm text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors" placeholder="Kodun Başlığı (örn: Auth Middleware)" required />
              <button disabled={isSavingCode} className="w-full bg-[#DE7A00] py-3.5 rounded-xl font-bold text-sm text-[#030027] hover:bg-[#c26a00] transition-colors disabled:opacity-50">{isSavingCode ? "KAYDEDİLİYOR..." : "ARŞİVE EKLE"}</button>
              <button type="button" onClick={() => setShowSnippetModal(false)} className="w-full text-[#F2F3D9]/50 text-xs font-bold mt-2 hover:text-[#F2F3D9]">İptal</button>
            </form>
          </div>
        </div>
      )}

      {/* SOL PANEL: KABİLE DETAYLARI VE ÜYE HİYERARŞİSİ */}
      <aside className="w-full md:w-72 bg-[#02001a] border-r border-[#F2F3D9]/10 p-6 flex flex-col z-10 select-none shadow-2xl shrink-0">
        <Link href="/dashboard" className="text-[#F2F3D9]/50 hover:text-[#DE7A00] text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 mb-10 transition-colors">
          <span className="w-6 h-6 bg-[#F2F3D9]/5 rounded-lg flex items-center justify-center">←</span> Ana Üsse Dön
        </Link>

        {/* KABİLE KİMLİK KARTI */}
        <div className="text-center mb-8 bg-[#030027] border border-[#F2F3D9]/10 p-6 rounded-2xl">
          <span className="text-5xl mb-3 block drop-shadow-md">{hub?.icon}</span>
          <h2 className="text-lg font-bold text-[#F2F3D9] mb-2">{hub?.name}</h2>
          <span className="inline-block bg-[#F2F3D9]/5 text-[#F2F3D9]/70 border border-[#F2F3D9]/10 px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
            {hub?.category}
          </span>
        </div>

        {/* KABİLE ÜYELERİ LİSTESİ */}
        <div className="flex-1 flex flex-col min-h-[200px]">
          <h3 className="text-[10px] font-bold text-[#F2F3D9]/40 uppercase tracking-widest mb-4 flex justify-between items-center border-b border-[#F2F3D9]/10 pb-2">
            <span>Ağdaki Profesyoneller</span>
            <span className="bg-[#F2F3D9]/10 text-[#F2F3D9] px-2 py-0.5 rounded text-[9px]">{hub?.members?.length || 1}</span>
          </h3>
          
          <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
            <div className="flex items-center gap-3 p-3 bg-[#DE7A00]/10 border border-[#DE7A00]/30 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#030027] border border-[#DE7A00]/50 flex items-center justify-center font-bold text-sm text-[#DE7A00] overflow-hidden">
                {user?.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user?.username?.[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-[#F2F3D9]">{user?.username} <span className="text-[9px] text-[#DE7A00] ml-1">(Sen)</span></p>
                <p className="text-[9px] text-[#F2F3D9]/50 font-semibold mt-0.5">{user?.karmaPoints || 0} Puan</p>
              </div>
            </div>
          </div>
        </div>

        {/* CANLI BAĞLANTI TETİKLEYİCİSİ */}
        <div className="mt-auto pt-4">
          <button onClick={handleStartVoiceNetwork} disabled={localStream !== null} className="w-full bg-[#DE7A00] hover:bg-[#c26a00] disabled:bg-[#005700] disabled:text-[#F2F3D9] text-[#030027] font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            <span className="text-base">🎙️</span> {localStream ? "AĞA BAĞLISIN" : "CANLI AĞI BAŞLAT"}
          </button>
        </div>
      </aside>

      {/* SAĞ PANEL: İLETİŞİM, VİDEO VE CANLI IDE */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-grid-slate-900/[0.05]">
        
        {/* ÜST BAR VE MEDYA KONTROLLERİ */}
        <div className="px-6 py-4 border-b border-[#F2F3D9]/10 bg-[#02001a]/80 backdrop-blur-md flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-[#005700] rounded-full animate-pulse"></div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-[#F2F3D9]">Sinerji İletişim Ağı</h3>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsIdeOpen(!isIdeOpen)} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border ${isIdeOpen ? 'bg-[#030027] text-[#DE7A00] border-[#DE7A00]' : 'bg-[#F2F3D9]/5 text-[#F2F3D9] border-[#F2F3D9]/10 hover:border-[#DE7A00]/50'}`}>
               💻 KOD LABORATUVARI {isIdeOpen ? "(AÇIK)" : "(KAPALI)"}
            </button>

            {localStream && (
              <div className="flex gap-2 border-l border-[#F2F3D9]/10 pl-4 ml-2">
                <button onClick={toggleMute} className={`p-2 rounded-lg border text-xs font-bold transition-colors ${isMuted ? "bg-[#520000] border-[#520000] text-[#F2F3D9]" : "bg-[#F2F3D9]/5 border-[#F2F3D9]/10 text-[#F2F3D9]/70 hover:text-[#F2F3D9]"}`} title="Mikrofon">{isMuted ? "🔇" : "🎙️"}</button>
                <button onClick={toggleCamera} className={`p-2 rounded-lg border text-xs font-bold transition-colors ${isCamOff ? "bg-[#520000] border-[#520000] text-[#F2F3D9]" : "bg-[#F2F3D9]/5 border-[#F2F3D9]/10 text-[#F2F3D9]/70 hover:text-[#F2F3D9]"}`} title="Kamera">{isCamOff ? "📹" : "📹"}</button>
                <button onClick={handleScreenShare} className={`p-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors ${isScreenSharing ? "bg-[#DE7A00] text-[#030027] border-[#DE7A00]" : "bg-[#F2F3D9]/5 border-[#F2F3D9]/10 text-[#F2F3D9]/70 hover:text-[#F2F3D9]"}`} title="Ekran Paylaş">🖥️ Ekran</button>
              </div>
            )}
            <button onClick={() => router.push('/dashboard')} className="bg-[#520000] hover:bg-[#7a0000] text-[#F2F3D9] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ml-2">AYRIL</button>
          </div>
        </div>

        {/* ANA GÖVDE: EKRAN BÖLÜNME MANTIĞI */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SOL KISIM: VİDEO & SOHBET */}
          <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isIdeOpen ? 'w-1/2 border-r border-[#F2F3D9]/10' : 'w-full'}`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar flex flex-col">
              
              {/* WEBRTC VİDEO EKRANLARI */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {localStream && !isCamOff && (
                  <div className="w-full min-w-[240px] max-w-sm bg-[#02001a] border-2 border-[#DE7A00]/50 rounded-2xl p-1.5 relative overflow-hidden aspect-video shadow-lg">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl transform scale-x-[-1]" />
                    <div className="absolute bottom-3 left-3 bg-[#030027]/80 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-[#F2F3D9]">Sen</div>
                    {isScreenSharing && <div className="absolute top-3 right-3 bg-[#DE7A00] text-[#030027] px-2 py-1 rounded text-[8px] font-bold uppercase">YAYINDA</div>}
                  </div>
                )}
                {remoteStreams.map((remote) => <RemoteVideo key={remote.peerId} peerId={remote.peerId} stream={remote.stream} />)}
              </div>

              {/* MESAJLAŞMA AKIŞI */}
              <div className="space-y-4 flex-1 max-w-4xl mx-auto w-full mt-4">
                {messages.length === 0 ? (
                  <div className="text-center py-10 bg-[#F2F3D9]/5 border border-dashed border-[#F2F3D9]/20 rounded-2xl">
                    <p className="text-xs text-[#F2F3D9]/50 font-medium">Toplantı notlarını veya iletişim loglarını buradan paylaşın.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?._id || msg.user === user?._id;
                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] text-[#F2F3D9]/40 font-bold uppercase mb-1 px-1 tracking-widest">@{msg.username}</span>
                        <div className={`max-w-[85%] px-4 py-3 rounded-xl text-xs leading-relaxed border ${isMe ? "bg-[#030027] border-[#DE7A00]/30 text-[#F2F3D9] rounded-tr-none" : "bg-[#F2F3D9]/5 border-[#F2F3D9]/10 text-[#F2F3D9]/90 rounded-tl-none"}`}>
                          {msg.content}
                          {msg.attachment && (
                            <div className="mt-3 pt-3 border-t border-[#F2F3D9]/10">
                              {msg.attachmentType?.startsWith("image/") ? (
                                <img src={msg.attachment} className="max-w-full rounded-lg" alt="Ek" />
                              ) : (
                                <a href={msg.attachment} download={msg.attachmentName} className="text-[10px] font-bold uppercase bg-[#F2F3D9]/10 px-3 py-2 rounded-lg block text-center hover:bg-[#F2F3D9]/20 transition-colors">📁 {msg.attachmentName}</a>
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

            {/* SOHBET GİRİŞ ALANI */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#F2F3D9]/10 bg-[#02001a]/90 backdrop-blur-md">
              <div className="max-w-4xl mx-auto flex flex-col gap-2">
                {attachmentName && (
                  <div className="bg-[#030027] border border-[#DE7A00]/30 px-4 py-2 rounded-xl text-[10px] font-bold text-[#DE7A00] flex justify-between items-center">
                    <span>📎 Ek: {attachmentName}</span>
                    <button type="button" onClick={() => { setAttachment(""); setAttachmentName(""); }} className="text-[#F2F3D9] hover:text-red-400">×</button>
                  </div>
                )}
                <div className="flex gap-3 relative">
                  <label className="bg-[#F2F3D9]/5 hover:bg-[#F2F3D9]/10 text-[#F2F3D9]/60 hover:text-[#DE7A00] px-4 flex items-center justify-center rounded-xl border border-[#F2F3D9]/10 cursor-pointer transition-colors">
                    <span className="text-lg">📎</span>
                    <input type="file" onChange={handleFileChange} className="hidden" />
                  </label>
                  <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Mesaj gönder..." className="flex-1 bg-[#F2F3D9]/5 border border-[#F2F3D9]/10 rounded-xl pl-4 pr-16 py-3 text-xs text-[#F2F3D9] outline-none focus:border-[#DE7A00] transition-colors" autoComplete="off" />
                  <button type="submit" disabled={isSending || (!textInput.trim() && !attachment)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#DE7A00] hover:bg-[#c26a00] disabled:bg-[#F2F3D9]/10 disabled:text-[#F2F3D9]/30 text-[#030027] font-bold w-10 h-8 rounded-lg text-xs transition-colors flex items-center justify-center">➤</button>
                </div>
              </div>
            </form>
          </div>

          {/* SAĞ KISIM: CANLI IDE VE ARŞİV PANELİ (Sadece isIdeOpen true ise görünür) */}
          {isIdeOpen && (
             <div className="w-1/2 flex flex-col bg-[#010014] border-l border-[#F2F3D9]/10 animate-in slide-in-from-right duration-300">
                <div className="px-5 py-3 bg-[#030027] border-b border-[#F2F3D9]/10 flex justify-between items-center z-10">
                   <div className="flex gap-4">
                      <button onClick={() => setShowArchive(false)} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${!showArchive ? 'text-[#DE7A00]' : 'text-[#F2F3D9]/40 hover:text-[#F2F3D9]'}`}>Canlı Editör</button>
                      <button onClick={() => setShowArchive(true)} className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${showArchive ? 'text-[#DE7A00]' : 'text-[#F2F3D9]/40 hover:text-[#F2F3D9]'}`}>Geçmiş Arşiv</button>
                   </div>
                   {!showArchive && (
                      <button onClick={() => setShowSnippetModal(true)} className="bg-[#DE7A00] hover:bg-[#c26a00] text-[#030027] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors">
                         Kaydet
                      </button>
                   )}
                </div>

                {!showArchive ? (
                   <div className="flex-1 overflow-hidden relative">
                     <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vs-dark"
                        value={liveCode}
                        onChange={handleEditorChange}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          fontFamily: "monospace",
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          padding: { top: 16 }
                        }}
                     />
                   </div>
                ) : (
                   <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#02001a]/50">
                      {!hub?.codeSnippets || hub.codeSnippets.length === 0 ? (
                         <div className="text-center py-10 opacity-50">
                            <p className="text-xs font-bold uppercase tracking-widest">Arşiv Boş</p>
                            <p className="text-[10px] mt-2">Henüz kaydedilmiş bir kod parçacığı yok.</p>
                         </div>
                      ) : (
                         hub.codeSnippets.map((snippet, idx) => (
                            <div key={idx} className="bg-[#030027] border border-[#F2F3D9]/10 rounded-xl p-4 group">
                               <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-xs font-bold text-[#DE7A00]">{snippet.title}</h4>
                                  <div className="flex gap-3 text-[9px] text-[#F2F3D9]/40 uppercase font-bold tracking-widest">
                                     <span>@{snippet.authorName}</span>
                                     <span>{formatDate(snippet.savedAt)}</span>
                                  </div>
                               </div>
                               <pre className="bg-[#010014] p-3 rounded-lg border border-[#F2F3D9]/5 text-[11px] text-[#F2F3D9] font-mono overflow-x-auto custom-scrollbar">
                                  <code>{snippet.code}</code>
                               </pre>
                               <button onClick={() => { setLiveCode(snippet.code); setShowArchive(false); toast("Kod editöre aktarıldı", { icon: '💻' }); }} className="mt-3 w-full bg-[#F2F3D9]/5 hover:bg-[#F2F3D9]/10 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors">
                                  Editöre Aktar
                               </button>
                            </div>
                         )).reverse()
                      )}
                   </div>
                )}
             </div>
          )}

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F2F3D930; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #DE7A00; }
      `}</style>
    </div>
  );
}