import { Document, Schema } from "mongoose";

export interface IUser extends Document {
   clerkId:string,
   email:string,
   name:string,
   avatar?:string,
   online:boolean,
   lastSeen: Date,
   createdAt: Date
}

const userSchema = new Schema<IUser>({
   clerkId: { type: String, required: true, unique: true },
   email: { type: String, required: true },
   name: { type: String, required: true},
   avatar: { type: String },
   online: { type: Boolean , default: false },
   lastSeen: { type: Date , default: Date.now },
   createdAt: { type: Date , default: Date.now }
}, {
    timestamps: true
})