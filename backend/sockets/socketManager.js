const Hub = require('../models/Hub');

// Aktif (online) kullanıcıları tutacağımız geçici hafıza
let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡ Bir kullanıcı canlı ağa bağlandı: ${socket.id}`);

    // --- WEBRTC SİNYAL AKTARICISI ---
    socket.on("join-voice-room", ({ hubId, peerId }) => {
      socket.broadcast.to(hubId).emit("user-connected-voice", peerId);
      console.log(`🎙️ Kabile ${hubId} odasında yeni canlı bağlantı: ${peerId}`);
    });
    
    // 1. Yeni kullanıcı giriş yaptığında onu listeye ekle
    socket.on("newUser", (userId) => {
      addNewUser(userId, socket.id);
      console.log("Aktif Sinerji Üyeleri:", onlineUsers.length);
    });

    // 2. Birebir Mesaj (DM) Gönderildiğinde
    socket.on("sendDm", ({ senderId, receiverId, content }) => {
      const receiver = getUser(receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit("getDm", {
          sender: senderId,
          content,
          createdAt: Date.now()
        });
      }
    });
    
    // --- SİNERJİ CANLI KOD LABORATUVARI SOKETİ ---
    socket.on("sendCodeUpdate", ({ hubId, code }) => {
      socket.to(hubId).emit("receiveCodeUpdate", code); 
    });

    // --- YENİ EKLENEN: BİLDİRİM FIRLATICI ---
    socket.on("sendNotification", ({ senderId, receiverId, type, message }) => {
      const receiver = getUser(receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit("getNotification", {
          senderId,
          type,
          message,
          createdAt: Date.now()
        });
      }
    });

    socket.on("newPostComment", ({ postId }) => {
       // İlgili gönderiye açık olan herkese yenileme komutu gönder
       io.emit("newCommentUpdate", { postId });
    });
    
    // 3. Kabile (Hub) Odasına Mesaj Gönderildiğinde
    socket.on("sendHubMessage", async (data) => {
      socket.broadcast.to(data.hubId).emit("getHubMessage", {
        user: data.senderId,
        username: data.username,
        content: data.content,
        attachment: data.attachment,
        attachmentName: data.attachmentName,
        attachmentType: data.attachmentType,
        createdAt: Date.now()
      });

      // MESAJI VERİTABANINA (ARŞİVE) KAYDET
      try {
        await Hub.findByIdAndUpdate(data.hubId, {
          $push: {
            messages: {
              senderId: data.senderId,
              username: data.username,
              content: data.content,
              attachment: data.attachment,
              attachmentName: data.attachmentName,
              attachmentType: data.attachmentType,
              createdAt: Date.now()
            }
          }
        });
        console.log(`💾 Mesaj Kabile ${data.hubId} arşivine kalıcı olarak işlendi.`);
      } catch (err) {
        console.error("Mesaj Kabile arşivine kaydedilirken hata oluştu:", err);
      }
    });

    // 4. Kabile Odasına (Room) Katılma Olayı
    socket.on("joinHubRoom", (hubId) => {
      socket.join(hubId);
      console.log(`Kullanıcı ${socket.id}, ${hubId} kabilesine girdi.`);
    });

    // 5. Kullanıcı siteden çıktığında
    socket.on("disconnect", () => {
      console.log(`🔌 Bir kullanıcı ağdan koptu: ${socket.id}`);
      removeUser(socket.id);
    });
  });
};
