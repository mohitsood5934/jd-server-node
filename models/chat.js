import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["employee", "bot", "hr"],
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  intent: {
    type: String,
  },
  sequence: {
    type: Number,
  },
  empCode: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const Chat = mongoose.model("botChat", chatSchema);

export default Chat;