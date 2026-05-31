import prisma from './prisma.js';
import logger from './logger.js';

async function testDatabaseConnection() {
  try {
    logger.info('Testing database connection...');
    
    await prisma.$connect();
    logger.info('✅ Database connection successful');
    
    // Test a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('✅ Database query test successful');
    
    await prisma.$disconnect();
    logger.info('✅ Database disconnected successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error({ msg: '❌ Database connection failed', error });
    process.exit(1);
  }
}

testDatabaseConnection();
