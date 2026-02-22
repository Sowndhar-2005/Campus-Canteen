import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-canteen';

async function resetUserStats() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('⚙️  Resetting user statistics and wallet balances...');

        // 1. Reset stats and history for all non-admin users
        const baseUpdate = {
            $set: {
                totalOrders: 0,
                totalSpent: 0,
                walletTransactions: [],
                collegePoints: 0 // Resetting points as well since total spent is 0
            }
        };

        const totalResult = await User.updateMany(
            { isAdmin: false },
            baseUpdate
        );
        console.log(`📊 Reset stats for ${totalResult.modifiedCount} users`);

        // 2. Set Dayscholar amount to 30,000
        const dayScholarResult = await User.updateMany(
            { isAdmin: false, userType: 'dayscholar' },
            { $set: { walletBalance: 30000 } }
        );
        console.log(`💰 Set Dayscholar balance (30,000) for ${dayScholarResult.modifiedCount} users`);

        // 3. Set Hosteller amount to 50,000
        const hostellerResult = await User.updateMany(
            { isAdmin: false, userType: 'hosteller' },
            { $set: { walletBalance: 50000 } }
        );
        console.log(`🏨 Set Hosteller balance (50,000) for ${hostellerResult.modifiedCount} users`);

        console.log('\n✅ All updates completed successfully.');

    } catch (error) {
        console.error('❌ Reset Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

resetUserStats();
