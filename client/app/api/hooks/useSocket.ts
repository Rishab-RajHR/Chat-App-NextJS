import { Socket } from "socket.io-client"

interface UserSocketReturn{
     socket: Socket | null,
     isConnected: boolean,
     sendMessage: (data: {
        senderId: string,
        receiverId: string,
        text?: string,
        image?: string,
        imagePublicId?: string,
        video?: string,
        videoPublicId?: string,
        file?: string,
        filePublicId?: string,
        messageType: "text" | "image" | "video" | "file",
     }) => void,
     sendTyping: (data: { senderId: string; receiverId: string; isTyping: boolean }),
     markAsRead: (userId: string, contactId: string) => void
}

export const useSocket = async (userId: string | null): Promise<UserSocketReturn> => {
      return {
          socket: null,
          isConnected: false,
          sendMessage: () => {},
          sendTyping: () => {},
          markAsRead: () => {}
      }
}