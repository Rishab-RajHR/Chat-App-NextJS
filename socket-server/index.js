import { Server } from "socket.io"
import http from "http"
import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "./models/User.js"
import { send } from "process"
import Conversation from "./models/Conversation.js"
import { v2 as cloudinary } from 'cloudinary';

dotenv.config()

const PORT = process.env.PORT || 3004
const MONGODB_URI = process.env.MONGODB_URI
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3003" 


mongoose.connect(MONGODB_URI).then(()=>console.log("MongoDB connected successfully")).catch((err)=> {console.log("Failed to connect MongoDB", err)
  process.exit(1);
}
)

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const deletedFromCloudinary = (publicId) => {
     try {
        if (!publicId) {
            return { result: "skipped", message: "No pubic id provided" }
        }

        return new Promise((resolve, reject) => {
             cloudinary.uploader.destroy(publicId, (error, result) => {
                  if (error) {
                     console.error("Cloudinary deletion error :", error);
                  } else {
                     resolve(result)
                  }
             })
        })
     } catch (error) {
         console.error("Error in deletedFromCloudinary", error);
         throw error
     } 
}

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

        const result = await Message.updateMany({ senderId: contactId, receiverId: userId, read: false }, {
            $set: {
                read: true,
                delivered: true
            }
        })

        const readMessages = await Message.find({
              senderId: contactId,
              receiverId: userId,
              read: true
        }).select('_id').lean()

        const readIdx = readMessages.map((m) => m._id.toString())

        const payload = {
              userId: userId,
              contactId: contactId,
              messages: readIdx
        }

        // Notify sender so their checkmarks turn blue
        io.to(`user-${contactId}`).emit('message-read', payload)
         
        // Confirmation to reader
        io.to(`user-${userId}`).emit('message-read', payload)

      } catch (error) {
        
         console.error("Error in mark-read socket handler :", error); 

      }
  })

  socket.on("delete", async (data) => {
      try {
        
        const {messageId, userId, deletedForEveryone} = data

        const message = await Message.findById(messageId)
        if(!message){
            socket.emit("delete-error", { error: "Message not found" });
            return
        }

        if(message.senderId.toString() !== userId && message.receiverId.toString() !== userId){
            socket.emit("delete-error", { error: "Not authorized to delete this message" })
            return
        }

        let mediaType = "text";
        if (message.image) mediaType = "image"
        else if (message.video) mediaType = "video"
        else if (message.file) mediaType = "file"

        let cloudinaryDeleted = false;
        const deletionDetails = []

        if(message.imagePublicId){
             try {
                const result = await deletedFromCloudinary(message.imagePublicId)
                cloudinaryDeleted = true;
                deletionDetails.push({type: "image", publicId: message.imagePublicId, result })
             } catch (error) {
                 deletionDetails.push({type: "image", error: error.message })
             }
        }
        if(message.videoPublicId){
             try {
                const result = await deletedFromCloudinary(message.videoPublicId)
                cloudinaryDeleted = true;
                deletionDetails.push({type: "video", publicId: message.videoPublicId, result })
             } catch (error) {
                 deletionDetails.push({type: "video", error: error.message })
             }
        }
        if(message.filePublicId){
             try {
                const result = await deletedFromCloudinary(message.filePublicId)
                cloudinaryDeleted = true;
                deletionDetails.push({type: "file", publicId: message.filePublicId, result })
             } catch (error) {
                 deletionDetails.push({type: "file", error: error.message })
             }
        }

        let updatedMessage;
        if (deletedForEveryone) {
            let deletedText = "Text message was deleted"
            if (mediaType === "image") deletedText = "Image was deleted"
            else if (mediaType === "video") deletedText = "Video was deleted"
            if (mediaType === "file") deletedText = "File was deleted"

            updatedMessage = await Message.findByIdAndUpdate(messageId, {
                 deleted: true,
                 deletedForEveryone: true,
                 text: deletedText,
                 image: null,
                 imagePublicId: null,
                 video: null,
                 videoPublicId: null,
                 file: null,
                 filePublicId: null,
                 type: "text"
            }, {
               new: true
            })
        } else {
            updatedMessage = new Message.findByIdAndUpdate(messageId, {
                $addToSet: { deletedFor: userId }
            }, { new: true })
        }

          const messageToSend = {
              ...updatedMessage,
              _id: updatedMessage._id.toString(),
              senderId: updatedMessage.senderId.toString(),
              receiverId: updatedMessage.receiverId.toString(),
              deleted: updatedMessage.deleted || false,
              deletedForEveryone: updatedMessage.deletedForEveryone || false,
              deletedFor: updatedMessage.deletedFor?.map(id => id.toString()) || [],
              cloudinaryDeleted,
              deletionDetails,
              mediaType
          }

          io.to(`user-${message.senderId.toString()}`).emit("message-deleted",messageToSend)
          io.to(`user-${message.receiverId.toString()}`).emit("message-deleted",messageToSend)

      } catch (error) {
         console.error("Error deleting message:", error);
         socket.emit("delete-error", { error: error.message })
      }
  })

  socket.on("disconnect", async () => {
     try {
        const userId = socket.userId

        if (userId) {
            await User.findByIdAndUpdate(userId, {
                  online: false,
                  lastSeen: new Date()
            })
            io.emit("user-offline", userId)
            onlineUsers.delete(userId)
        }
     } catch (error) {
        console.error('Socket error for ${socket.id} ', error);
     }
  })

  socket.on("error",  (error) => {
      console.error(`Socket error for ${socket.id} `, error);
  })  

});
server.listen(PORT, () => {
     console.log(`Socket IO Server is running on ${PORT}`);
     console.log('http://localhost:${PORT}');
     console.log('http://localhost:${CLIENT_URL}');
});

process.on("SIGINT", async () => {
     console.log("Shutting down gracefully");
     await mongoose.connection.close()
     server.close(() => {
        console.log("Server closed");
        process.exit(0);
     })
})

process.on("SIGTERM", async () => {
     console.log("Shutting down gracefully");
     await mongoose.connection.close()
     server.close(() => {
          console.log("Server closed");
          process.exit(0);
     })
})