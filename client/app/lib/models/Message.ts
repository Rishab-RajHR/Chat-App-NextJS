import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
   senderId : mongoose.Types.ObjectId | IUser
   receiverId : mongoose.Types.ObjectId | IUser
   text?: string,
   image?: string,
   imagePublicId?: string,
   video?: string,
   videoPublicId?: string,
   file?: string,
   filePublicId?: string,
   type: "text" | "image" | "video" | "file",
   mediaType: "text" | "image" | "video" | "file" | null,
   read: boolean,
   delivered: boolean,
   deleted: boolean,
   deletedForEveryone: boolean,
   deletedFor: mongoose.Types.ObjectId[],
   createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
   senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, },
   receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true, },
   text: { type: String, },
   image: { type: String },
   imagePublicId: { type: String },
   video: { type: String },
   videoPublicId: { type: String },
   type: { type: String, enum: ["text", "image", "video", "file"], default: null },
   mediaType: { type: String, enum: ["text", "image", "video", "file"], default: null },
   read: { type: Boolean, default: false },
   delivered: { type: Boolean, default: false },
   deleted: { type: Boolean, default: false },
   deletedForEveryone: { type: Boolean, default: false },
   deletedFor: [{ type: Schema.Types.ObjectId, ref: "User"}],
   createdAt: { type: Date , default: Date.now }
}, {
    timestamps: true
});

const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
export default Message