import mongoose, { Document, Schema } from 'mongoose';

export interface IProfileChangeRequest extends Document {
    userId: mongoose.Types.ObjectId;
    requestType: 'email' | 'registrationNumber' | 'userType' | 'name';
    currentValue: string;
    requestedValue: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
}

const profileChangeRequestSchema = new Schema<IProfileChangeRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestType: {
            type: String,
            enum: ['email', 'registrationNumber', 'userType'],
            required: true,
        },
        currentValue: {
            type: String,
            required: true,
        },
        requestedValue: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: {
            type: Date,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        rejectionReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const ProfileChangeRequest = mongoose.model<IProfileChangeRequest>(
    'ProfileChangeRequest',
    profileChangeRequestSchema
);
