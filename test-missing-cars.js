const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMissingCars() {
  try {
    // The specific car IDs from our previous search
    const targetCarIds = [
      'cmdioti1z00027nfmj7zwbf11', // 2006 Honda CR-V
      'cmdhbb2m0000210h6fskpl2ys'  // 2014 BMW X5
    ];

    console.log('=== TESTING MISSING CARS ===\n');

    // First, let's get the full data for these cars
    const targetCars = await prisma.car.findMany({
      where: {
        id: { in: targetCarIds }
      },
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          }
        }
      }
    });

    console.log('TARGET CARS FULL DATA:');
    targetCars.forEach(car => {
      console.log(`\n=== ${car.make} ${car.model} ${car.year} ===`);
      console.log(`ID: ${car.id}`);
      console.log(`Title: ${car.title}`);
      console.log(`Status: ${car.status}`);
      console.log(`Featured: ${car.featured}`);
      console.log(`Created: ${car.createdAt.toISOString()}`);
      console.log(`Updated: ${car.updatedAt.toISOString()}`);
      console.log(`Price: ${car.price}`);
      console.log(`Mileage: ${car.mileage}`);
      console.log(`Location: ${JSON.stringify(car.location)}`);
      console.log(`User ID: ${car.userId}`);
      console.log(`User Status: ${car.user?.status}`);
      console.log(`User Role: ${car.user?.role}`);
      console.log(`Image Count: ${car.images.length}`);
      if (car.images.length > 0) {
        console.log(`First Image: ${car.images[0].originalUrl}`);
      }
    });

    // Now let's simulate the exact query from the main cars API
    console.log('\n=== SIMULATING MAIN CARS API QUERY ===');
    const mainApiResults = await prisma.car.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
        },
        user: {
          include: {
            dealerProfile: true,
          },
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    console.log(`Total ACTIVE cars from main API query: ${mainApiResults.length}`);

    // Check if our target cars are in the results
    const foundCarIds = mainApiResults.map(car => car.id);
    targetCarIds.forEach(targetId => {
      const isFound = foundCarIds.includes(targetId);
      const car = targetCars.find(c => c.id === targetId);
      console.log(`\n${car?.make} ${car?.model} ${car?.year} (${targetId}): ${isFound ? '✅ FOUND' : '❌ MISSING'}`);
      
      if (!isFound) {
        console.log(`  Possible reasons:`);
        console.log(`  - Car status: ${car?.status} (should be ACTIVE)`);
        console.log(`  - User status: ${car?.user?.status} (should be ACTIVE)`);
        console.log(`  - Car might be outside top 50 newest cars`);
      }
    });

    // Let's also check the position of these cars in the full result set
    console.log('\n=== CHECKING POSITION IN FULL ACTIVE CARS LIST ===');
    const allActiveCars = await prisma.car.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        make: true,
        model: true,
        year: true,
        createdAt: true
      }
    });

    console.log(`Total ACTIVE cars in database: ${allActiveCars.length}`);

    targetCarIds.forEach(targetId => {
      const position = allActiveCars.findIndex(car => car.id === targetId);
      const car = allActiveCars.find(c => c.id === targetId);
      if (position >= 0) {
        console.log(`\n${car?.make} ${car?.model} ${car?.year}:`);
        console.log(`  Position in list: ${position + 1} (${position < 50 ? 'within first 50' : 'outside first 50'})`);
        console.log(`  Created: ${car?.createdAt.toISOString()}`);
      } else {
        console.log(`\n${targetId}: NOT FOUND in active cars list`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMissingCars();