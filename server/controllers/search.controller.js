import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

// Search history model (simplified - in production you might want a separate model)
const searchHistory = new Map();

export const globalSearch = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query, limit = 10, type = "all" } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const results = {};

    // Search messages if type is 'all' or 'messages'
    if (type === "all" || type === "messages") {
      const messages = await searchMessagesInternal(userId, query, Math.ceil(limit / 4));
      results.messages = messages;
    }

    // Search users if type is 'all' or 'users'
    if (type === "all" || type === "users") {
      const users = await searchUsersInternal(userId, query, Math.ceil(limit / 4));
      results.users = users;
    }

    // Search conversations if type is 'all' or 'conversations'
    if (type === "all" || type === "conversations") {
      const conversations = await searchConversationsInternal(userId, query, Math.ceil(limit / 4));
      results.conversations = conversations;
    }

    // Search media if type is 'all' or 'media'
    if (type === "all" || type === "media") {
      const media = await searchMediaInternal(userId, query, Math.ceil(limit / 4));
      results.media = media;
    }

    // Save search to history
    await saveSearchToHistory(userId, query);

    res.status(200).json({
      success: true,
      query,
      results,
      totalResults: Object.values(results).reduce((sum, items) => sum + (items?.length || 0), 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error performing global search",
      error: error.message
    });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query, conversationId, page = 1, limit = 20, dateFrom, dateTo } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const messages = await searchMessagesInternal(userId, query, limit, page, conversationId, dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      query,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalResults: messages.length,
        hasNextPage: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching messages",
      error: error.message
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const users = await searchUsersInternal(userId, query, limit, page);
    
    res.status(200).json({
      success: true,
      query,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalResults: users.length,
        hasNextPage: users.length === parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching users",
      error: error.message
    });
  }
};

export const searchConversations = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const conversations = await searchConversationsInternal(userId, query, limit, page);
    
    res.status(200).json({
      success: true,
      query,
      conversations,
      pagination: {
        currentPage: parseInt(page),
        totalResults: conversations.length,
        hasNextPage: conversations.length === parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching conversations",
      error: error.message
    });
  }
};

export const searchMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query, mediaType = "all", conversationId, page = 1, limit = 20 } = req.query;

    const media = await searchMediaInternal(userId, query, limit, page, conversationId, mediaType);
    
    res.status(200).json({
      success: true,
      query,
      media,
      pagination: {
        currentPage: parseInt(page),
        totalResults: media.length,
        hasNextPage: media.length === parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching media",
      error: error.message
    });
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query, type = "all", limit = 10 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Query is required for suggestions"
      });
    }

    const suggestions = [];

    // Get user suggestions
    if (type === "all" || type === "users") {
      const userSuggestions = await User.find({
        _id: { $ne: userId },
        $or: [
          { username: new RegExp(query, 'i') },
          { fullName: new RegExp(query, 'i') }
        ]
      })
      .select("username fullName avatar")
      .limit(Math.ceil(limit / 3));

      suggestions.push(...userSuggestions.map(user => ({
        type: "user",
        id: user._id,
        text: user.fullName || user.username,
        subtitle: user.username,
        avatar: user.avatar
      })));
    }

    // Get conversation suggestions
    if (type === "all" || type === "conversations") {
      const conversations = await Conversation.find({
        "participants.userId": userId,
        "participants.leftAt": { $exists: false },
        name: { $exists: true, $regex: query, $options: 'i' }
      })
      .populate("participants.userId", "username fullName avatar")
      .limit(Math.ceil(limit / 3));

      suggestions.push(...conversations.map(conv => ({
        type: "conversation",
        id: conv._id,
        text: conv.name,
        subtitle: `${conv.participants.length} members`,
        avatar: conv.avatar
      })));
    }

    // Get recent search history
    const userHistory = searchHistory.get(userId) || [];
    const historyMatches = userHistory
      .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(item => ({
        type: "history",
        text: item.query,
        subtitle: "Recent search",
        timestamp: item.timestamp
      }));

    suggestions.push(...historyMatches);

    // Sort suggestions by relevance and limit
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.text.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.text.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      })
      .slice(0, limit);

    res.status(200).json({
      success: true,
      query,
      suggestions: sortedSuggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting search suggestions",
      error: error.message
    });
  }
};

export const saveSearchHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Valid search query is required"
      });
    }

    await saveSearchToHistory(userId, query);

    res.status(200).json({
      success: true,
      message: "Search saved to history"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving search history",
      error: error.message
    });
  }
};

export const getSearchHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 20 } = req.query;

    const userHistory = searchHistory.get(userId) || [];
    const recentHistory = userHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      history: recentHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching search history",
      error: error.message
    });
  }
};

export const clearSearchHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    
    searchHistory.delete(userId);

    res.status(200).json({
      success: true,
      message: "Search history cleared successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing search history",
      error: error.message
    });
  }
};

// Internal search functions
const searchMessagesInternal = async (userId, query, limit, page = 1, conversationId = null, dateFrom = null, dateTo = null) => {
  const skip = (page - 1) * limit;
  const searchRegex = new RegExp(query, 'i');

  // Build query
  let searchQuery = {
    content: searchRegex,
    deletedFor: { $ne: userId }
  };

  if (conversationId) {
    searchQuery.conversationId = conversationId;
  } else {
    // Only search in conversations where user is a participant
    const userConversations = await Conversation.find({
      "participants.userId": userId,
      "participants.leftAt": { $exists: false }
    }).select("_id");
    
    searchQuery.conversationId = { $in: userConversations.map(c => c._id) };
  }

  if (dateFrom || dateTo) {
    searchQuery.timestamp = {};
    if (dateFrom) searchQuery.timestamp.$gte = new Date(dateFrom);
    if (dateTo) searchQuery.timestamp.$lte = new Date(dateTo);
  }

  return await Message.find(searchQuery)
    .populate("senderId", "username fullName avatar")
    .populate("conversationId", "name conversationType")
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip(skip);
};

const searchUsersInternal = async (userId, query, limit, page = 1) => {
  const skip = (page - 1) * limit;
  const searchRegex = new RegExp(query, 'i');

  return await User.find({
    _id: { $ne: userId },
    $or: [
      { username: searchRegex },
      { fullName: searchRegex },
      { email: searchRegex }
    ]
  })
  .select("username fullName avatar bio isOnline lastSeen")
  .sort({ username: 1 })
  .limit(parseInt(limit))
  .skip(skip);
};

const searchConversationsInternal = async (userId, query, limit, page = 1) => {
  const skip = (page - 1) * limit;
  const searchRegex = new RegExp(query, 'i');

  return await Conversation.find({
    "participants.userId": userId,
    "participants.leftAt": { $exists: false },
    $or: [
      { name: searchRegex },
      { description: searchRegex }
    ]
  })
  .populate("participants.userId", "username fullName avatar")
  .populate("lastMessage", "content messageType timestamp")
  .sort({ lastActivity: -1 })
  .limit(parseInt(limit))
  .skip(skip);
};

const searchMediaInternal = async (userId, query, limit, page = 1, conversationId = null, mediaType = "all") => {
  const skip = (page - 1) * limit;
  
  let searchQuery = {
    deletedFor: { $ne: userId }
  };

  // Build media type query
  if (mediaType === "all") {
    searchQuery.$or = [
      { messageType: "image" },
      { messageType: "video" },
      { messageType: "audio" },
      { messageType: "file" }
    ];
  } else {
    searchQuery.messageType = mediaType;
  }

  if (conversationId) {
    searchQuery.conversationId = conversationId;
  } else {
    // Only search in conversations where user is a participant
    const userConversations = await Conversation.find({
      "participants.userId": userId,
      "participants.leftAt": { $exists: false }
    }).select("_id");
    
    searchQuery.conversationId = { $in: userConversations.map(c => c._id) };
  }

  // If query is provided, search in content or media metadata
  if (query) {
    const searchRegex = new RegExp(query, 'i');
    searchQuery.$and = [
      { ...searchQuery },
      {
        $or: [
          { content: searchRegex },
          { "media.originalName": searchRegex }
        ]
      }
    ];
    delete searchQuery.$or; // Remove the media type $or since we're now using $and
    if (mediaType === "all") {
      searchQuery.$and[0].$or = [
        { messageType: "image" },
        { messageType: "video" },
        { messageType: "audio" },
        { messageType: "file" }
      ];
    } else {
      searchQuery.$and[0].messageType = mediaType;
    }
  }

  return await Message.find(searchQuery)
    .populate("senderId", "username fullName avatar")
    .populate("conversationId", "name conversationType")
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip(skip);
};

const saveSearchToHistory = async (userId, query) => {
  const userHistory = searchHistory.get(userId) || [];
  
  // Remove existing entry if it exists
  const filteredHistory = userHistory.filter(item => item.query !== query);
  
  // Add new search at the beginning
  filteredHistory.unshift({
    query,
    timestamp: new Date()
  });

  // Keep only last 50 searches
  const limitedHistory = filteredHistory.slice(0, 50);
  
  searchHistory.set(userId, limitedHistory);
};