import Resource from "../models/resource.model.js";

export const getResources = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isPublic: true, isActive: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const resources = await Resource.find(query)
      .populate('createdBy', 'username fullName role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-likes -dislikes');

    const total = await Resource.countDocuments(query);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalResources: total,
          hasMore: skip + resources.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    const resource = await Resource.findById(resourceId)
      .populate('createdBy', 'username fullName role avatar');

    if (!resource || !resource.isActive || !resource.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Get resource by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resource',
      error: error.message
    });
  }
};

export const createResource = async (req, res) => {
  try {
    const { title, description, type, url, category, tags } = req.body;
    const userId = req.user.userId;

    const resource = new Resource({
      title,
      description,
      type,
      url,
      category,
      tags,
      createdBy: userId
    });

    await resource.save();
    await resource.populate('createdBy', 'username fullName role');

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully'
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating resource',
      error: error.message
    });
  }
};

export const updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;

    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Only allow resource creator or admin to update
    if (resource.createdBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resource'
      });
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      resourceId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName role');

    res.json({
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully'
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: error.message
    });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.userId;

    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Only allow resource creator or admin to delete
    if (resource.createdBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resource'
      });
    }

    // Soft delete
    resource.isActive = false;
    await resource.save();

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: error.message
    });
  }
};

export const likeResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.userId;

    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Remove from dislikes if present
    resource.dislikes.pull(userId);

    // Toggle like
    if (resource.likes.includes(userId)) {
      resource.likes.pull(userId);
    } else {
      resource.likes.push(userId);
    }

    await resource.save();

    res.json({
      success: true,
      data: {
        likesCount: resource.likes.length,
        dislikesCount: resource.dislikes.length,
        isLiked: resource.likes.includes(userId)
      }
    });
  } catch (error) {
    console.error('Like resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking resource',
      error: error.message
    });
  }
};

export const dislikeResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.userId;

    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Remove from likes if present
    resource.likes.pull(userId);

    // Toggle dislike
    if (resource.dislikes.includes(userId)) {
      resource.dislikes.pull(userId);
    } else {
      resource.dislikes.push(userId);
    }

    await resource.save();

    res.json({
      success: true,
      data: {
        likesCount: resource.likes.length,
        dislikesCount: resource.dislikes.length,
        isDisliked: resource.dislikes.includes(userId)
      }
    });
  } catch (error) {
    console.error('Dislike resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disliking resource',
      error: error.message
    });
  }
};