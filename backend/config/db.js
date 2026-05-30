import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri) {
      console.log('Attempting to connect to configured MongoDB URI...');
      await mongoose.connect(mongoUri);
      console.log('Connected to configured MongoDB database.');
    } else {
      throw new Error('No MONGODB_URI provided in environment variables.');
    }
  } catch (error) {
    console.warn('⚠️ Standard MongoDB connection failed:', error.message);
    console.log('🔧 Starting local in-memory MongoDB fallback server...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.5'
        }
      });
      const memoryUri = mongoServer.getUri();
      
      await mongoose.connect(memoryUri);
      console.log('✅ Connected to local in-memory MongoDB Server:', memoryUri);
    } catch (memError) {
      console.error('❌ Failed to start in-memory MongoDB fallback server:', memError.message);
      process.exit(1);
    }
  }

  // Auto-seed if database is empty
  try {
    const User = (await import('../models/User.js')).default;
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('📭 Database is empty. Seeding sample datasets...');
      const { seedData } = await import('../scripts/seed.js');
      await seedData(false);
    }
  } catch (seedError) {
    console.error('⚠️ Could not perform auto-seeding:', seedError.message);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
  }
};
