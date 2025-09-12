const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPagination() {
  try {
    console.log('=== TESTING PAGINATION API ===\n');

    // Test page 1
    console.log('📄 TESTING PAGE 1 (First 24 cars):');
    const page1Response = await fetch('http://localhost:3000/api/cars?page=1&limit=24');
    const page1Data = await page1Response.json();
    
    if (page1Data.success) {
      console.log(`✅ Page 1: ${page1Data.cars.length} cars returned`);
      console.log(`📊 Pagination: Page ${page1Data.pagination.currentPage} of ${page1Data.pagination.totalPages}`);
      console.log(`📊 Total: ${page1Data.pagination.totalCount} cars`);
      console.log(`🔍 First car: ${page1Data.cars[0]?.make} ${page1Data.cars[0]?.model} ${page1Data.cars[0]?.year}`);
    } else {
      console.log('❌ Page 1 failed:', page1Data.error);
    }

    // Test page 2
    console.log('\n📄 TESTING PAGE 2 (Cars 25-48):');
    const page2Response = await fetch('http://localhost:3000/api/cars?page=2&limit=24');
    const page2Data = await page2Response.json();
    
    if (page2Data.success) {
      console.log(`✅ Page 2: ${page2Data.cars.length} cars returned`);
      console.log(`🔍 First car: ${page2Data.cars[0]?.make} ${page2Data.cars[0]?.model} ${page2Data.cars[0]?.year}`);
    } else {
      console.log('❌ Page 2 failed:', page2Data.error);
    }

    // Test page 3 (should contain our missing cars)
    console.log('\n📄 TESTING PAGE 3 (Cars 49+):');
    const page3Response = await fetch('http://localhost:3000/api/cars?page=3&limit=24');
    const page3Data = await page3Response.json();
    
    if (page3Data.success) {
      console.log(`✅ Page 3: ${page3Data.cars.length} cars returned`);
      console.log(`🔍 First car: ${page3Data.cars[0]?.make} ${page3Data.cars[0]?.model} ${page3Data.cars[0]?.year}`);
      
      // Check if our missing cars are on this page
      const targetCarIds = [
        'cmdioti1z00027nfmj7zwbf11', // 2006 Honda CR-V
        'cmdhbb2m0000210h6fskpl2ys'  // 2014 BMW X5
      ];
      
      const foundCars = page3Data.cars.filter(car => targetCarIds.includes(car.id));
      console.log(`\n🎯 MISSING CARS CHECK:`);
      console.log(`Found ${foundCars.length} of our missing cars on page 3:`);
      foundCars.forEach(car => {
        console.log(`  ✅ ${car.make} ${car.model} ${car.year} (ID: ${car.id})`);
      });

      // Check all cars on page 3
      console.log(`\n📋 ALL CARS ON PAGE 3:`);
      page3Data.cars.forEach((car, index) => {
        const isTargetCar = targetCarIds.includes(car.id) ? '🎯' : '  ';
        console.log(`${isTargetCar} ${index + 1}. ${car.make} ${car.model} ${car.year} - ${car.title}`);
      });
    } else {
      console.log('❌ Page 3 failed:', page3Data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if we can run this directly or if we need to start the server
if (process.argv[2] === '--local') {
  // Run without server (direct database check)
  console.log('Running direct database check...');
  testPagination().catch(console.error);
} else {
  console.log('To test pagination API:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. In another terminal, run: node test-pagination.js --local');
}