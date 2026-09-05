import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";
import { IMessage } from "./Message";

export interface IConversation extends Document {
   participants: mongoose.Types.ObjectId[] | IUser[],
   lastMessage?: mongoose.Types.ObjectId | IMessage,
   lastMessageText?: string,
   lastMessageTime?: Date,
   updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>({
   participants: [{type: Schema.Types.ObjectId, ref: "User"}],
   lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
   lastMessageText: {
     type: String
   },
   lastMessageTime: {
      type: Date
   },
   updatedAt: { type: Date , default: Date.now }
}, {
    timestamps: true
});

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema)
export default Conversation