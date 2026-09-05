import Message from "@/app/lib/models/Message";
import { connectedDatabase } from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) {
     try {
        await connectedDatabase()
        const userId = req.nextUrl.searchParams.get("userId")
        const contactId = req.nextUrl.searchParams.get("contactId")

        if(!userId || !contactId) {
            return NextResponse.json(
               { error: `UserId and ContactId are required` }, { status: 400 }
            )
        }
 
        const messages = await Message.find({
            $or: [
              { senderId: userId, receiverId: contactId },
              { senderId: userId, receiverId: contactId },
            ],
            deletedForEveryone: { $ne: true },
            deletedFor: { $ne: userId }
        }).sort({ createdAt: 1 }).limit(50)

        const formattedMessages = messages.map(msg => ({
            _id: msg._id.toString(),
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            text: msg.text || "",
            image: msg.image || null,
            video: msg.video || null,
            file: msg.file || null,
            type: msg.type || "text",
            mediaType: msg.mediaType || null,
            read: msg.read || false,
            delivered: msg.delivered || false,
            deleted: msg.deleted || false,
            deletedForEveryone: msg.deletedForEveryone || false,
            deletedFo: msg.deletedFor?.map((id: any) => id.toString()) || [],
            createAt: msg.createAt.toISOString()
        }))

        return NextResponse.json(formattedMessages);

     } catch (error) {
        console.error("Error Fetching :", error);
        return NextResponse.json({ error: "Failed to fetch messages ", details: error instanceof Error ? error.message : "Unknown Error" }, { status: 500 })
     }
}