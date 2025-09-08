import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { getIO } from "../sockets/index.js";

export const createGroup = async (req, res) => {
  const { name, description } = req.body;
  const createdBy = req.user.id;

  try {
    const group = new Group({
      name,
      description,
      createdBy,
      members: [createdBy],
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const joinGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this group" });
    }

    group.members.push(userId);
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const sendGroupMessage = async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const message = new Message({
      sender: senderId,
      group: groupId,
      content,
    });

    await message.save();

    group.messages.push(message._id);
    await group.save();

    const io = getIO();
    io.to(groupId).emit("newGroupMessage", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId).populate("messages");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group.messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
