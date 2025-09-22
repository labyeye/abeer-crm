const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    companyEmail: {
      type: String,
      required: [true, "Company email is required"],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email"],
    },
    companyPhone: {
      type: String,
      required: [true, "Company phone is required"],
      trim: true,
    },
    companyWebsite: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
    },
    companyLogo: {
      type: String,
      trim: true,
    },
    companyDescription: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    industry: {
      type: String,
      required: [true, "Industry is required"],
      enum: [
        "Photography",
        "Videography",
        "Event Planning",
        "Wedding Services",
        "Corporate",
        "Other",
      ],
    },
    foundedYear: {
      type: Number,
      min: [1900, "Founded year must be after 1900"],
      max: [new Date().getFullYear(), "Founded year cannot be in the future"],
    },
    employeeCount: {
      type: Number,
      default: 0,
      min: [0, "Employee count cannot be negative"],
    },
    // store a revenue breakdown so we can keep invoices/bookings/quotations separately
    revenue: {
      total: {
        type: Number,
        default: 0,
        min: [0, "Revenue cannot be negative"],
      },
      invoices: {
        type: Number,
        default: 0,
        min: [0, "Revenue cannot be negative"],
      },
      bookings: {
        type: Number,
        default: 0,
        min: [0, "Revenue cannot be negative"],
      },
      quotations: {
        type: Number,
        default: 0,
        min: [0, "Revenue cannot be negative"],
      },
    },
    companySettings: {
      timezone: {
        type: String,
        default: "UTC",
      },
      currency: {
        type: String,
        default: "USD",
      },
      language: {
        type: String,
        default: "en",
      },
    },

    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    contactInfo: {
      phone: String,
      email: String,
      whatsapp: String,
    },
    gstNumber: {
      type: String,
      required: true,
    },
    panNumber: String,
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ code: 1 });
branchSchema.index({ companyName: 1 });
branchSchema.index({ status: 1 });

module.exports = mongoose.model("Branch", branchSchema);
