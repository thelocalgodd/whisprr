import mongoose from "mongoose";

const counselorApplicationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  applicationData: {
    // Personal Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 50
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"]
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      zipCode: {
        type: String,
        required: true,
        trim: true
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: "United States"
      }
    },
    
    // Professional Information
    education: [{
      degree: {
        type: String,
        required: true,
        trim: true
      },
      institution: {
        type: String,
        required: true,
        trim: true
      },
      graduationYear: {
        type: Number,
        required: true
      },
      gpa: {
        type: Number,
        min: 0,
        max: 4
      }
    }],
    
    licenses: [{
      licenseType: {
        type: String,
        required: true,
        trim: true
      },
      licenseNumber: {
        type: String,
        required: true,
        trim: true
      },
      issuingState: {
        type: String,
        required: true,
        trim: true
      },
      issueDate: {
        type: Date,
        required: true
      },
      expirationDate: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "active"
      }
    }],
    
    experience: [{
      position: {
        type: String,
        required: true,
        trim: true
      },
      organization: {
        type: String,
        required: true,
        trim: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date
      },
      isCurrent: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000
      }
    }],
    
    specializations: [{
      type: String,
      enum: [
        "anxiety", "depression", "trauma", "substance_abuse", 
        "family_therapy", "couples_therapy", "grief_counseling",
        "eating_disorders", "behavioral_issues", "developmental_disabilities",
        "geriatric_care", "chronic_illness", "crisis_intervention",
        "group_therapy", "cognitive_behavioral_therapy", "other"
      ]
    }],
    
    otherSpecialization: {
      type: String,
      trim: true,
      maxlength: 200
    },
    
    // Documents
    documents: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ["degree", "license", "certification", "resume", "reference", "other"],
        required: true
      },
      fileName: {
        type: String,
        required: true
      },
      filePath: {
        type: String,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      verifiedAt: {
        type: Date,
        default: null
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      }
    }],
    
    // References
    references: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      title: {
        type: String,
        required: true,
        trim: true
      },
      organization: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      relationship: {
        type: String,
        required: true,
        trim: true
      },
      yearsKnown: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    
    // Additional Information
    motivation: {
      type: String,
      required: [true, "Please explain your motivation for becoming a counselor"],
      trim: true,
      maxlength: 2000
    },
    
    availability: {
      hoursPerWeek: {
        type: Number,
        required: true,
        min: 5,
        max: 80
      },
      preferredSchedule: {
        type: String,
        enum: ["mornings", "afternoons", "evenings", "nights", "flexible"],
        required: true
      },
      timeZone: {
        type: String,
        required: true
      }
    },
    
    backgroundCheck: {
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date,
        default: null
      },
      status: {
        type: String,
        enum: ["pending", "clear", "flagged"],
        default: "pending"
      },
      notes: {
        type: String,
        trim: true
      }
    },
    
    agreements: {
      termsOfService: {
        type: Boolean,
        required: [true, "You must agree to the terms of service"]
      },
      privacyPolicy: {
        type: Boolean,
        required: [true, "You must agree to the privacy policy"]
      },
      codeOfConduct: {
        type: Boolean,
        required: [true, "You must agree to the code of conduct"]
      },
      continuingEducation: {
        type: Boolean,
        required: [true, "You must agree to continuing education requirements"]
      }
    }
  },
  
  // Application Status
  status: {
    type: String,
    enum: [
      "draft", 
      "submitted", 
      "under_review", 
      "pending_documents", 
      "background_check", 
      "interview_scheduled",
      "interview_completed",
      "approved", 
      "rejected", 
      "withdrawn"
    ],
    default: "draft"
  },
  
  // Review Information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  approvalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  rejectionReason: {
    type: String,
    enum: [
      "incomplete_application",
      "insufficient_qualifications",
      "invalid_credentials",
      "background_check_issues",
      "failed_interview",
      "other"
    ]
  },
  
  rejectionNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Communication Log
  communications: [{
    type: {
      type: String,
      enum: ["email", "phone", "meeting", "note"],
      required: true
    },
    subject: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Important Dates
  submittedAt: {
    type: Date,
    default: null
  },
  
  interviewDate: {
    type: Date,
    default: null
  },
  
  approvedAt: {
    type: Date,
    default: null
  },
  
  rejectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
counselorApplicationSchema.index({ userId: 1 });
counselorApplicationSchema.index({ status: 1 });
counselorApplicationSchema.index({ submittedAt: -1 });
counselorApplicationSchema.index({ reviewedAt: -1 });

// Virtual for full name
counselorApplicationSchema.virtual('fullName').get(function() {
  return `${this.applicationData.firstName} ${this.applicationData.lastName}`;
});

// Virtual for completion percentage
counselorApplicationSchema.virtual('completionPercentage').get(function() {
  const requiredFields = [
    'applicationData.firstName',
    'applicationData.lastName',
    'applicationData.dateOfBirth',
    'applicationData.phoneNumber',
    'applicationData.address.street',
    'applicationData.education.0',
    'applicationData.motivation'
  ];
  
  let completed = 0;
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj && obj[key], this);
    if (value) completed++;
  }
  
  return Math.round((completed / requiredFields.length) * 100);
});

// Method to submit application
counselorApplicationSchema.methods.submit = function() {
  if (this.status !== 'draft') {
    throw new Error('Application has already been submitted');
  }
  
  this.status = 'submitted';
  this.submittedAt = new Date();
};

// Method to approve application
counselorApplicationSchema.methods.approve = function(reviewerId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.approvedAt = new Date();
  this.approvalNotes = notes;
};

// Method to reject application
counselorApplicationSchema.methods.reject = function(reviewerId, reason, notes = '') {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.rejectionNotes = notes;
};

// Method to add communication
counselorApplicationSchema.methods.addCommunication = function(type, subject, message, sentBy) {
  this.communications.push({
    type,
    subject,
    message,
    sentBy,
    sentAt: new Date(),
    isRead: false
  });
};

// Static method to get pending applications
counselorApplicationSchema.statics.getPending = function() {
  return this.find({ 
    status: { $in: ['submitted', 'under_review', 'pending_documents'] } 
  })
  .populate('userId', 'username email fullName')
  .sort({ submittedAt: -1 });
};

export default mongoose.model("CounselorApplication", counselorApplicationSchema);