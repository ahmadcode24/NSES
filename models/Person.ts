import mongoose, { Schema, Document, Model } from "mongoose";

export type RoleType = "President" | "Vice President" | "Head" | "Member";

export interface ISocials {
  linkedin?: string;
  github?: string;
  other?: string;
}

export interface IPerson extends Document {
  studentId: string;
  name: string;
  role: RoleType;
  team: string;
  bio: string;
  photoUrl: string;
  socials: ISocials;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SocialsSchema = new Schema<ISocials>(
  {
    linkedin: { type: String, default: "", trim: true },
    github: { type: String, default: "", trim: true },
    other: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const PersonSchema = new Schema<IPerson>(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
      immutable: true, // Schema-level immutability: once created, studentId cannot be modified
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["President", "Vice President", "Head", "Member"],
        message: "{VALUE} is not a valid role",
      },
      default: "Member",
    },
    team: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    socials: {
      type: SocialsSchema,
      default: () => ({ linkedin: "", github: "", other: "" }),
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save normalization and immutability check
PersonSchema.pre("save", function (next) {
  if (this.studentId) {
    this.studentId = this.studentId.trim().toUpperCase();
  }
  if (!this.isNew && this.isModified("studentId")) {
    return next(
      new Error("Non-negotiable rule: studentId is permanent and cannot be modified.")
    );
  }
  next();
});

// Guard against update queries attempting to alter studentId
PersonSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function (next) {
  const update = this.getUpdate() as Record<string, unknown> | null;
  if (!update) return next();

  if ("studentId" in update) {
    return next(
      new Error("Non-negotiable rule: studentId is immutable and cannot be updated.")
    );
  }
  if (update.$set && "studentId" in (update.$set as Record<string, unknown>)) {
    return next(
      new Error("Non-negotiable rule: studentId is immutable and cannot be updated.")
    );
  }
  next();
});

// Guard against deletion queries: Hard deletion is prohibited; active: false must be used instead
PersonSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], function (next) {
  return next(
    new Error(
      "Non-negotiable rule: Deletion of member records is prohibited to preserve QR code integrity. Use active: false instead."
    )
  );
});

export const Person: Model<IPerson> =
  mongoose.models.Person || mongoose.model<IPerson>("Person", PersonSchema);

export default Person;
