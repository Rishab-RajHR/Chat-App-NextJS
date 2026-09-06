import { Server } from "socket.io"
import http from "http"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const PORT = process.env.PORT || 3004
const MONGODB_URI = process.env.MONGODB_URI
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3003" 

mongoose.connect(MONGODB_URI).then(()=>console.log("MongoDB connected successfully")).catch((err)=> {console.log("Failed to connect MongoDB", err)
  process.exit(1);
}
)