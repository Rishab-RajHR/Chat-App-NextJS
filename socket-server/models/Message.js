import mongoose, {  Schema } from "mongoose";

const MessageSchema = new Schema({
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

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema)
export default Message