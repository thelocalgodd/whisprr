import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getIO } from "../sockets/index.js";

export const sendMessage = async (req, res) => {
  const { recipientId, content } = req.body;
  const senderId = req.user.id;

  try {
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const message = new Message({
      sender: senderId,
      receiver: recipientId,
      content,
    });

    await message.save();

    const io = getIO();
    io.to(recipientId).emit("newMessage", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMessages = async (req, res) => {
  const { recipientId } = req.params;
  const senderId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: recipientId },
        { sender: recipientId, receiver: senderId },
      ],
    }).sort({ createdAt: "asc" });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
