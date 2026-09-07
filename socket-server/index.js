import { Server } from "socket.io"
import http from "http"
import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "./models/User.js"
import { send } from "process"
import Conversation from "./models/Conversation.js"

dotenv.config()

const PORT = process.env.PORT || 3004
const MONGODB_URI = process.env.MONGODB_URI
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3003" 

mongoose.connect(MONGODB_URI).then(()=>console.log("MongoDB connected successfully")).catch((err)=> {console.log("Failed to connect MongoDB", err)
  process.exit(1);
}
)

const server = http.createServer()

const id = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET","POST"],
        credentials: true
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000
})

const onlineUsers = new Map()
const typingTimeout = new Map()

io.on('connection', (socket) => {
   socket.on("user-connected", async (userId) => {
    try {
       onlineUsers.set(userId, socket.id)
       socket.userId = userId
       socket.join(`user ${userId}`)

       await User.findOneAndUpdate(userId, {
           online: true,
           lastSeen: new Date()
       })

       io.emit("user-online", userId)

    } catch (error) {
       console.log("Error in user-connected :", error);
       socket.emit("error", {
           message: "Failed to connect user",
           details: error.message
       })
    }
   })

  socket.on("typing", (data) => {
       try {
          const { senderId, receiverId, isTyping } = data
          
          const timeoutKey = `${senderId}-${receiverId}`
          if (typingTimeout.has(timeoutKey)) {
              clearTimeout(typingTimeout.get(timeoutKey))
              typingTimeout.delete(timeoutKey)
          }

          if (isTyping) {
              const timeout =  setTimeout(() => {
                  io.to(`user-${receiverId}`).emit("user-typing", {
                      senderId,
                      isTyping: false
                  });
                  typingTimeout.delete(timeoutKey)
              }, 5000)
              typingTimeout.set(timeoutKey, timeout)          
          }

          io.to(`use-${receiverId}`).emit("user-typing",{
              senderId,
              isTyping
          })
       } catch (error) {
          console.error("Error is typing error :",error);
       }
  })

  socket.on("send-message", async (data) => {
       try {
          const { senderId, receiverId, text, image, video, file, messageType, imagePublicId, videoPublicId, filePublicId } = data

          if (!senderId || !receiverId) {
             throw new Error("Sender and Receiver IDs are required")
          }

          const message = new Message({
              senderId,
              receiverId,
              text: text || "",
              image: image || null,
              imagePublicId: imagePublicId || null,
              file: file || null,
              filePublicId: videoPublicId || null,
              type: messageType || "text",
              mediaType: messageType || "text",
              read: false,
              delivered: true,
              deleted: false,
              deletedForEveryone: false,
              createdAt: new Date()
          })

          const savedMessage = await message.save()

          

          let lastMessageText = text || "Media"
          if (image) {
             lastMessageText = "Image"
          } else if (video) {
              lastMessageText = "Video"
          } else if (file) {
              lastMessageText = "File"
          } else if (text) {
              lastMessageText = text
          }

          const conversation = await Conversation.findOne({
               participants: { $all: [senderId, receiverId] }
          })

          if(!conversation){
              consversation = new Conversation({
                   participants : [senderId, receiverId],
                   lastMessage : sendMessage._id,
                   lastMessageText,
                   lastMessageTime: sendMessage.createdAt
              })
          } else {
              conversation.lastMessage = savedMessage._id;
              conversation.lastMessageText = lastMessageText;
              conversation.lastMessageTime = saveMessage.createdAt;
              conversation.updatedAt = new Date()
          }

          await conversation.save()

          const messageToSend = {
              _id: savedMessage._id.toString(),
              senderId: savedMessage.senderId.toString(),
              receiverId: savedMessage.receiverId.toString(),
              text: savedMessage.text,
              image: savedMessage.image,
              imagePublicId: savedMessage.imagePublicId,
              file: savedMessage.file,
              filePublicId: savedMessage.filePublicId,
              video: savedMessage.video,
              videoPublicId: savedMessage.videoPublicId,
              type: savedMessage.messageType,
              mediaType: savedMessage.messageType,
              read: false,
              delivered: false,
              deleted: savedMessage.deleted,
              deletedForEveryone: savedMessage.deletedForEveryone,
              deletedFor: savedMessage.deletedFor?.map(id => id.toString()) || [],
              createdAt: new Date()
          }

          io.to(`user-${senderId}`).emit("message-user", {
               ...messageToSend,
               delivered: false,
               read: false
          })

          setTimeout(() => {
              io.to(`user-${senderId}`).emit("message-delivered", {
                  messageId: savedMessage._id.toString(),
                  receiverId: receiverId
              })
          }, 500)

       } catch (error) {
           console.log('Error sending message :', error);
           socket.emit("message-error", {
              message: "Failed to send message",
              details: error.message
           })
       }
  })

  socket.on("mark-read", async (userId, contactId) => {
      try {
        
        if (!userId || !contactId) return

      } catch (error) {
        
      }
  })
})
server.listen(3000);