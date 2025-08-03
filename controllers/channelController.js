import Channel from "../models/channel.js"; // Capitalize model import
import User from "../models/user.js"; // Ensure this exists for reference
import Chat from "../models/chat.js";
import axios from "axios";
import mongoose from "mongoose";

export const createChannel = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is required" });
  }

  try {
    // Create and save the new channel
    const newChannel = new Channel({
      userId,
      status: "in progress",
    });

    const savedChannel = await newChannel.save();

    // Populate userId to fetch user details
    const populatedChannel = await savedChannel.populate(
      "userId",
      "employeeCode email"
    );

    res.status(201).json({
      msg: "Channel created successfully",
      data: populatedChannel,
    });
  } catch (error) {
    console.error("Error creating channel:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const handleMessage = async (req, res) => {
  const { channelId, userId, message } = req.body;

  if (!channelId || !userId || !message) {
    return res
      .status(400)
      .json({ msg: "channelId, userId, and message are required" });
  }

  try {
    // 1. Fetch user details using userId
    const user = await User.findById(userId).select("employeeCode email");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const { employeeCode: empCode, email } = user;
    // 1. Get current max sequence for session
    const lastChat = await Chat.findOne({ channelId })
      .sort({ sequence: -1 })
      .select("sequence");

    const nextSequence = lastChat ? lastChat.sequence + 1 : 1;

    // 2. Save employee message
    await Chat.create({
      sender: "employee",
      channelId,
      message,
      // intent: "employee_msg", // Or keep blank if intent not available
      sequence: nextSequence,
      empCode,
      email,
    });

    // 3. Call external AI bot API
    // const API_URL = "http://192.168.51.151:5011/ask_hr";
    const botResponse = await axios.post("http://192.168.51.151:5012/ask_hr", {
      emp_id: empCode.toString(),
      question: message,
    });

    console.log(botResponse, "botresppnse");
    const botMsgText =
      botResponse?.data?.answer?.content?.trim() || botResponse.data.answer;

    const intent = botResponse.data.answer?.category || "Others";
    // console.log(intent);

    // 4. Save bot reply as a new document with next sequence
    const chatObj = {
      sender: "bot",
      intent,
      channelId,
      message: botMsgText,
      // intent: botResponse.data.intent || "",
      sequence: nextSequence + 1,
      empCode,
      email,
    };

    await Chat.insertOne(chatObj);

    // 5. Send bot response to frontend
    res.status(200).json({ reply: botMsgText });
  } catch (error) {
    console.error("Error handling chat:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const getChannelChat = async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ msg: "Valid Channel ID is required" });
  }

  try {
    // Fetch channel status
    const channel = await Channel.findById(channelId).select("status");
    if (!channel) {
      return res.status(404).json({ msg: "Channel not found" });
    }

    // Fetch chat messages
    const chats = await Chat.find({ channelId }).sort({ sequence: 1 }).lean(); // lean() makes documents plain JS objects (easier to manipulate)

    res.status(200).json({
      msg: "Chat history retrieved successfully",
      status: channel.status, // Status is added outside
      data: chats,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const updateChannelStatus = async (req, res) => {
  const { channelId, status } = req.body;

  // Validate required fields
  if (!channelId || !status) {
    return res.status(400).json({ msg: "channelId and status are required" });
  }
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ msg: "Invalid channelId format" });
  }
  // Validate status value
  const validStatuses = ["in progress", "resolved", "forwarded"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      msg: `Invalid status value. Allowed: ${validStatuses.join(", ")}`,
    });
  }

  try {
    // Alternative method
    const updatedChannel = await Channel.updateOne(
      { _id: channelId },
      { $set: { status: status } }
    );

    // Then fetch the updated document
    const fetchedChannel = await Channel.findById(channelId);

    res.status(200).json({
      msg: "Channel status updated successfully",
      data: fetchedChannel,
    });
  } catch (error) {
    console.error("Error updating channel status:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const fetchChannels = async (req, res) => {
  try {
    const channels = await Channel.find().populate("userId"); // optional: populate user data
    res.status(200).json({
      msg: "Channels fetched successfully",
      data: channels,
    });
  } catch (error) {
    console.error("Error fetching channels:", error.message);
    res.status(500).json({
      msg: "Server error while fetching channels",
      error: error.message,
    });
  }
};

export const getDashboardDetails = async (req, res) => {
  const { userId } = req.body;
  const isAdmin = req.user.role === "hr" || false;

  if (!userId) {
    return res.status(400).json({ msg: "User ID is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "Invalid userId format" });
  }

  let findQuery = {
    userId,
  };
  if (isAdmin) {
    findQuery = {
      status: "forwarded",
    };
  }
  try {
    // Get the most recent channel for the user
    const channels = await Channel.find(findQuery)
      .select("_id status createdAt updatedAt category, userId")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      msg: "Channel details retrieved successfully",
      data: channels,
    });
  } catch (error) {
    console.error("Error fetching dashboard details:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};


export const replyToUser = async (req, res) => {
  const { channelId, sender, message } = req.body;
  const user = req.user;

  if (!channelId || !sender || !message) {
    return res.status(400).json({ msg: "channelId, sender, and message are required" });
  }

  try {
    // Find the next sequence number for the channel
    const lastChat = await Chat.findOne({ channelId }).sort({ sequence: -1 });
    const nextSequence = lastChat ? lastChat.sequence + 1 : 1;

    const messageObj = {
      channelId,
      sender,
      message,
      empCode: user.employeeCode,
      email: user.email,
      sequence: nextSequence,
    };

    const savedMessage = await Chat.create(messageObj);

    return res.status(201).json({
      msg: "Reply sent successfully",
      data: savedMessage,
    });
  } catch (error) {
    console.error("Error occurred while replying to the user:", error.message);
    return res.status(500).json({ msg: "Internal server error", error: error.message });
  }
};

export const handleMessageEmail = async (req, res) => {

    const { email, message } = req.body;

    // Fix validation logic - should be && not ||
    if (!email || !message) {
        return res.status(400).json({ msg: "email and message are required" });
    }

    try {
        // 1. Fetch user details using email
        const user = await User.findOne({ email }).select("employeeCode email _id");

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const { employeeCode: empCode, email: userEmail, _id: userId } = user;

        let chan = await Channel.create({
            userId: userId,
            status: "in progress"
        });
        console.log("Created new channel:", chan._id);

        const channelId = chan._id;

        // 4. Get current max sequence for this channel
        const lastChat = await Chat.findOne({ channelId })
            .sort({ sequence: -1 })
            .select("sequence");

        const nextSequence = lastChat ? lastChat.sequence + 1 : 1;

        // 5. Save employee message
        await Chat.create({
            sender: "employee",
            channelId,
            message,
            sequence: nextSequence,
            empCode,
            email: userEmail,
        });

        console.log('Employee message saved:', empCode, message);

        // 6. Call external AI bot API
        const botResponse = await axios.post("http://192.168.51.151:5011/ask_hr", {
            emp_id: empCode.toString(),
            question: message,
        });

        // const botMsgText = botResponse.data.answer?.trim() || "Sorry, I could not understand that.";

        console.log(botResponse, "botresppnse");
        const botMsgText =
            botResponse?.data?.answer?.content?.trim() || botResponse.data.answer;

        const category = botResponse.data.answer?.category || "Others";

        await Channel.findByIdAndUpdate(
            channelId,
            { category: category },
            { new: true } // Returns the updated document
        );

        console.log("Bot response:", botMsgText);

        // 7. Save bot reply as a new document with next sequence
        await Chat.create({
            sender: "bot",
            channelId,
            message: botMsgText,
            sequence: nextSequence + 1,
            empCode,
            email: userEmail,
        });

        // 8. Send bot response to frontend along with channel info
        res.status(200).json({
            reply: botMsgText,
            channelId: channelId,
            // channelId: channelId,
            // channelStatus: channel.status
        });

    } catch (error) {
        console.error("Error handling chat:", error.message);
        console.error("Full error:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
};