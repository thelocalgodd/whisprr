import User from "../models/user.model.js";
import CounselorApplication from "../models/counselorApplication.model.js";

// Get all pending counselor applications
export const getPendingApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'submitted' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status === 'all') {
      query.status = { $in: ['submitted', 'under_review', 'pending_documents', 'background_check'] };
    } else {
      query.status = status;
    }

    const applications = await CounselorApplication.find(query)
      .populate('userId', 'username email fullName avatar createdAt')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CounselorApplication.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalApplications: total,
          hasMore: skip + applications.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get pending applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending applications',
      error: error.message
    });
  }
};

// Get single counselor application by ID
export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await CounselorApplication.findById(applicationId)
      .populate('userId', 'username email fullName avatar createdAt lastSeen')
      .populate('reviewedBy', 'username fullName')
      .populate('communications.sentBy', 'username fullName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get additional user stats
    const userStats = {
      accountAge: Math.floor((Date.now() - application.userId.createdAt) / (1000 * 60 * 60 * 24)), // days
      isActive: application.userId.isActive,
      lastSeen: application.userId.lastSeen
    };

    res.json({
      success: true,
      data: {
        application,
        userStats
      }
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// Approve counselor application
export const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { approvalNotes } = req.body;
    const reviewerId = req.user.userId;

    const application = await CounselorApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Approve the application
    application.approve(reviewerId, approvalNotes);
    await application.save();

    // Update user role to counselor
    await User.findByIdAndUpdate(application.userId, { 
      role: 'counselor',
      isVerified: true 
    });

    // Add communication log
    application.addCommunication(
      'email',
      'Application Approved',
      `Your counselor application has been approved. ${approvalNotes || ''}`,
      reviewerId
    );
    await application.save();

    const updatedApplication = await CounselorApplication.findById(applicationId)
      .populate('userId', 'username email fullName')
      .populate('reviewedBy', 'username fullName');

    res.json({
      success: true,
      data: updatedApplication,
      message: 'Application approved successfully'
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
    });
  }
};

// Reject counselor application
export const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason, rejectionNotes } = req.body;
    const reviewerId = req.user.userId;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const application = await CounselorApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Reject the application
    application.reject(reviewerId, rejectionReason, rejectionNotes);
    await application.save();

    // Add communication log
    application.addCommunication(
      'email',
      'Application Rejected',
      `Your counselor application has been rejected. Reason: ${rejectionReason}. ${rejectionNotes || ''}`,
      reviewerId
    );
    await application.save();

    const updatedApplication = await CounselorApplication.findById(applicationId)
      .populate('userId', 'username email fullName')
      .populate('reviewedBy', 'username fullName');

    res.json({
      success: true,
      data: updatedApplication,
      message: 'Application rejected'
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting application',
      error: error.message
    });
  }
};

// Request more information from applicant
export const requestMoreInfo = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { requestedInfo, notes } = req.body;
    const reviewerId = req.user.userId;

    if (!requestedInfo) {
      return res.status(400).json({
        success: false,
        message: 'Requested information is required'
      });
    }

    const application = await CounselorApplication.findByIdAndUpdate(
      applicationId,
      {
        status: 'pending_documents',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Add communication log
    application.addCommunication(
      'email',
      'Additional Information Required',
      `We need additional information to process your application: ${requestedInfo}. ${notes || ''}`,
      reviewerId
    );
    await application.save();

    const updatedApplication = await CounselorApplication.findById(applicationId)
      .populate('userId', 'username email fullName')
      .populate('reviewedBy', 'username fullName');

    res.json({
      success: true,
      data: updatedApplication,
      message: 'Information request sent'
    });
  } catch (error) {
    console.error('Request more info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting information',
      error: error.message
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const reviewerId = req.user.userId;

    const validStatuses = [
      'under_review', 'pending_documents', 'background_check', 
      'interview_scheduled', 'interview_completed'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await CounselorApplication.findByIdAndUpdate(
      applicationId,
      {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes
      },
      { new: true }
    ).populate('userId', 'username email fullName')
     .populate('reviewedBy', 'username fullName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Add communication log
    application.addCommunication(
      'note',
      'Status Updated',
      `Application status updated to: ${status.replace('_', ' ')}. ${notes || ''}`,
      reviewerId
    );
    await application.save();

    res.json({
      success: true,
      data: application,
      message: 'Application status updated'
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// Get application statistics
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      CounselorApplication.countDocuments({ status: 'submitted' }),
      CounselorApplication.countDocuments({ status: 'under_review' }),
      CounselorApplication.countDocuments({ status: 'pending_documents' }),
      CounselorApplication.countDocuments({ status: 'approved' }),
      CounselorApplication.countDocuments({ status: 'rejected' }),
      CounselorApplication.countDocuments({ 
        submittedAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }),
    ]);

    const [submitted, underReview, pendingDocs, approved, rejected, lastMonth] = stats;

    res.json({
      success: true,
      data: {
        submitted,
        underReview,
        pendingDocuments: pendingDocs,
        approved,
        rejected,
        total: submitted + underReview + pendingDocs + approved + rejected,
        lastMonthApplications: lastMonth
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics',
      error: error.message
    });
  }
};