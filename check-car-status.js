const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCarStatuses() {
  try {
    const allCars = await prisma.car.count();
    const activeCars = await prisma.car.count({ where: { status: 'ACTIVE' } });
    const nonActiveCars = await prisma.car.findMany({ 
      where: { status: { not: 'ACTIVE' } },
      select: { 
        id: true, 
        title: true, 
        status: true, 
        make: true, 
        model: true, 
        year: true,
        createdAt: true
      }
    });
    
    console.log(`Total cars: ${allCars}`);
    console.log(`Active cars: ${activeCars}`);
    console.log(`Non-active cars (${allCars - activeCars}):`);
    
    if (nonActiveCars.length > 0) {
      nonActiveCars.forEach(car => {
        const displayTitle = car.title || `${car.make} ${car.model} ${car.year}`;
        console.log(`- ${displayTitle} (ID: ${car.id}) - Status: ${car.status} - Created: ${car.createdAt.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('All cars are ACTIVE');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCarStatuses();