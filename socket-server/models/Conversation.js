import mongoose, {  Schema } from "mongoose";


const ConversationSchema = new Schema({
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

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema)
export default Conversation