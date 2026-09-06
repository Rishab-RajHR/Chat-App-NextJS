import User from "@/app/lib/models/User";
import { connectedDatabase } from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
     try {
        await connectedDatabase()

        const { clerkId, email, name } = await req.json()

        let user =  await User.findOne({ clerkId })

        if(!user){
            
             user = new User({
                 clerkId,
                 email,
                 name,
                 avatar: name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase(),
                 online: true
             })
             await user.save()
        } else {
           user.email = email;
           user.name = name;
           user.lastSeen = new Date();
           await user.save(); 
        }

        return NextResponse.json({
            userId: user._id.toString(),
            user
        })
     } catch (error) {
        console.error("Error syncing user :", error);
        return NextResponse.json({ error: "Failed to syncing user"}, { status: 500 })
     }
}