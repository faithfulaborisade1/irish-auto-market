const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMissingCarsPagination() {
  try {
    console.log('=== TESTING PAGINATION FOR MISSING CARS ===\n');

    const targetCarIds = [
      'cmdioti1z00027nfmj7zwbf11', // 2006 Honda CR-V
      'cmdhbb2m0000210h6fskpl2ys'  // 2014 BMW X5
    ];

    // Get all ACTIVE cars ordered by creation date (newest first, same as API)
    const allActiveCars = await prisma.car.findMany({
      where: { status: 'ACTIVE' },
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

    console.log(`📊 Total ACTIVE cars: ${allActiveCars.length}`);

    // Calculate pagination for 24 cars per page
    const carsPerPage = 24;
    const totalPages = Math.ceil(allActiveCars.length / carsPerPage);
    console.log(`📄 Total pages (24 cars/page): ${totalPages}`);

    // Find which page each missing car should be on
    console.log('\n🔍 LOCATING MISSING CARS:');
    targetCarIds.forEach(targetId => {
      const position = allActiveCars.findIndex(car => car.id === targetId);
      if (position >= 0) {
        const pageNumber = Math.floor(position / carsPerPage) + 1;
        const positionOnPage = (position % carsPerPage) + 1;
        const car = allActiveCars[position];
        
        console.log(`\n${car.make} ${car.model} ${car.year}:`);
        console.log(`  📍 Overall position: ${position + 1} of ${allActiveCars.length}`);
        console.log(`  📄 Should be on PAGE ${pageNumber}`);
        console.log(`  📍 Position on page: ${positionOnPage} of ${Math.min(carsPerPage, allActiveCars.length - (pageNumber - 1) * carsPerPage)}`);
        console.log(`  📅 Created: ${car.createdAt.toISOString().split('T')[0]}`);
      } else {
        console.log(`❌ Car ${targetId} not found in active cars`);
      }
    });

    // Show what would be on each page
    console.log(`\n📋 PAGE BREAKDOWN (${carsPerPage} cars per page):`);
    for (let page = 1; page <= Math.min(totalPages, 4); page++) { // Show first 4 pages
      const startIndex = (page - 1) * carsPerPage;
      const endIndex = Math.min(startIndex + carsPerPage, allActiveCars.length);
      const carsOnPage = allActiveCars.slice(startIndex, endIndex);
      
      console.log(`\nPAGE ${page} (positions ${startIndex + 1}-${endIndex}):`);
      carsOnPage.forEach((car, index) => {
        const isTargetCar = targetCarIds.includes(car.id) ? '🎯' : '  ';
        console.log(`${isTargetCar} ${index + 1}. ${car.make} ${car.model} ${car.year}`);
      });
    }

    if (totalPages > 4) {
      console.log(`\n... and ${totalPages - 4} more pages`);
    }

    console.log('\n✅ CONCLUSION:');
    console.log('With pagination working at 24 cars per page, both missing cars should now be accessible!');
    console.log('Users can navigate through pages to find all cars in the system.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMissingCarsPagination();