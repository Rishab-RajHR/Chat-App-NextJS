import mongoose, { Document, Schema } from "mongoose";


const userSchema = new Schema({
   clerkId: { type: String, required: true, unique: true },
   email: { type: String, required: true },
   name: { type: String, required: true},
   avatar: { type: String },
   online: { type: Boolean , default: false },
   lastSeen: { type: Date , default: Date.now },
   createdAt: { type: Date , default: Date.now }
}, {
    timestamps: true
});

const User = mongoose.models.User || mongoose.model("User", UserSchema)
export default User