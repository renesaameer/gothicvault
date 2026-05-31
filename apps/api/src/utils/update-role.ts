import prisma from './prisma.js';

async function updateRole() {
  try {
    // Update user role to admin
    await prisma.userRole.updateMany({
      where: { userId: '878b56fd-2a83-4c3c-b69b-1f0a1ff23735' },
      data: { role: 'admin' },
    });

    console.log('User role updated to admin');
  } catch (error) {
    console.error('Error updating role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRole();
