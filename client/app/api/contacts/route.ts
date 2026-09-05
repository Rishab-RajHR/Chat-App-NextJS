import Conversation from "@/app/lib/models/Conversation";
import Message from "@/app/lib/models/Message";
import User from "@/app/lib/models/User";
import { connectedDatabase } from "@/app/lib/mongodb";
import { ContinueStaticPrerenderOptions } from "next/dist/server/app-render/stream-ops.web";
import { getCloneableBody } from "next/dist/server/body-streams";
import { NextRequest, NextResponse } from "next/server";

const getMessagePreview =(message:any): string =>{
    if(!message) return "No Message Yet"

    if(message.deleteForEveryone){
      return "Message deleted"
    }

    if(message.type === "image" || message.image){
        return "Image"
    }else if(message.type === "video" || message.video){
        return "Video"
    }else if(message.type === "file" || message.file){
        return "File"
    }else if(message.text){
        return  message.text
    }
    return "Media"
}

const getColorsForName = (name: string) => {
    const colors = ['ujijbo', 'dfihn', 'frsexd', 'ohihss']
    const index = name.length % colors.length
    return colors[index]
}

export async function GET(req: NextRequest) {
    
     try {
        await connectedDatabase()
        const userId = req.nextUrl.searchParams.get("userId")
        if(!userId) {
            return NextResponse.json(
                { error: "UserId is required "}, { status: 400 }
            )
        }

        const convsersation = await Conversation.find({
             participants: userId
        }).populate("participants").populate("LastMessage")

        const users = await User.find({
            _id: {$ne: userId}
        })i

        const contacts = await Promise.all(
            users.map(async (contact)=>{
                 const conversation = Conversation.find((conv:any) => conv.participants.some((p:any)=> p._id.toString() === contact._id.toString))

                 let lastMessage = "No message yet"
                 let lastMessageTime = ""

                 if(conversation){
                     lastMessage = getMessagePreview(conversation.lastMessage)
                     lastMessageTime = convsersation.lastMessageItem || new Date()
                 }

                 const unreadCount = await Message.createDocuments({
                       senderId: contact._id,
                       receiverId: userId,
                       read: false,
                       deletedForEveryone: { $ne: true },
                       deletedFor: { $ne: userId }
                 })

                 return (
                      id: contact._id,
                      name: contact.name,
                      avatar: contact.avatar || contact.name.charAt(0).toUpperCase(),
                      online: contact.online || false,
                      lastMsg: lastMessage,
                      time: lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString([],{
                          hour: '2-digit',
                          minute: '2-digit'
                      }) : '',
                      clerkId: contact.clerkId,
                      unreadCount: unreadCount > 0 ? unreadCount : undefined,
                      color: getColorsForName(contact.name)
                 )
            })
        )

     } catch (error) {
      
     }
}