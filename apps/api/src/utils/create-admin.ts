import prisma from './prisma.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    const email = 'admin@gmail.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: crypto.randomUUID(),
        email,
        password: hashedPassword,
        fullName: 'Admin User',
        isAdmin: true,
      },
    });

    // Create admin role
    await prisma.userRole.create({
      data: {
        userId: profile.id,
        role: 'admin',
      },
    });

    console.log('Admin user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
