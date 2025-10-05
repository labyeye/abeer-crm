const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    functionDetails: {

      event: String,
      service: String,
      serviceType: [String],
      serviceCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory'
      },
      startDate: {
        type: Date,
        required: false,
      },
      endDate: {
        type: Date,
        required: false,
      },
      date: {
        type: Date,
        required: true,
      },
      time: {
        start: String,
        end: String,
      },
      venue: {
        name: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
      },
    },

    functionDetailsList: [
      {
        event: String,
        service: String,
        serviceType: [String],
        serviceCategory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ServiceCategory'
        },
        startDate: {
          type: Date,
          required: false,
        },
        endDate: {
          type: Date,
          required: false,
        },
        date: {
          type: Date,
          required: true,
        },
        time: {
          start: String,
          end: String,
        },
        venue: {
          name: String,
          address: String,
          city: String,
          state: String,
          pincode: String,
        },

        assignedStaff: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
          },
        ],
        inventorySelection: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
          },
        ],
      },
    ],
    services: [
      {
        service: {
          type: String,
          required: true,
        },
        // optional normalized category and type fields (allow multiple types)
        serviceType: {
          type: [String],
          default: [],
        },
        serviceCategory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ServiceCategory",
        },
        description: String,
        quantity: {
          type: Number,
          default: 1,
        },
        rate: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    serviceNeeded: {
      type: String,
      required: true,
    },
    // Note: per-service assignedStaff and inventorySelection live inside functionDetailsList
    // Top-level `inventorySelection` and `assignedStaff` removed to avoid duplication and confusion.
    bookingBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      applyGST: {
        type: Boolean,
        default: false,
      },
      gstAmount: {
        type: Number,
        default: 0,
      },
      gstRate: {
        type: Number,
        default: 0,
      },
      gstIncluded: {
        type: Boolean,
        default: false,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      manualTotal: {
        type: Boolean,
        default: false,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      advanceAmount: {
        type: Number,
        default: 0,
      },
      remainingAmount: {
        type: Number,
        required: true,
      },
    },
    staffAssignment: [
      {
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Staff",
        },
        role: String,
        assignedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    equipmentAssignment: [
      {
        equipment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    travelDetails: {
      method: {
        type: String,
        enum: ["bus", "train", "bike", "car", "other"],
        default: "bike",
      },
      budget: {
        type: Number,
        default: 0,
      },
      givenCash: {
        type: Number,
        default: 0,
      },
      remainingCash: {
        type: Number,
        default: 0,
      },
      travelNotes: String,
    },
    status: {
      type: String,
      enum: [
        "enquiry",
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "enquiry",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "completed"],
      default: "pending",
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    notes: String,
    event: String,
    videoOutput: String,
    photoOutput: String,
    rawOutput: String,
    audioOutput: String,
    videoOutputEnabled: {
      type: Boolean,
      default: false,
    },
    photoOutputEnabled: {
      type: Boolean,
      default: false,
    },
    rawOutputEnabled: {
      type: Boolean,
      default: false,
    },
    audioOutputEnabled: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ company: 1, branch: 1 });
bookingSchema.index({ client: 1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ "functionDetails.date": 1 });
bookingSchema.index({ status: 1 });
// Index dates inside functionDetailsList array for faster range queries
bookingSchema.index({ "functionDetailsList.date": 1 });
// Index service names inside services array to accelerate service-based lookups
bookingSchema.index({ "services.service": 1 });

module.exports = mongoose.model("Booking", bookingSchema);
