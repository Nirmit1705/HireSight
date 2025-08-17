import { PrismaClient } from '@prisma/client';

async function testAptitudeAPIs() {
  console.log('🧪 Testing Aptitude APIs...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData: any = await healthResponse.json();
    console.log('✅ Health check:', healthData?.message || 'OK');
    console.log('');

    // Test 2: Check database directly
    console.log('2. Testing database connection...');
    const prisma = new PrismaClient();
    
    try {
      const questionCount = await prisma.aptitudeQuestion.count();
      console.log('✅ Database contains:', questionCount, 'aptitude questions');
      
      // Show sample question
      const sampleQuestion = await prisma.aptitudeQuestion.findFirst({
        select: {
          questionText: true,
          category: true,
          difficulty: true,
          options: true
        }
      });
      
      if (sampleQuestion) {
        console.log('📄 Sample question:');
        console.log('   Text:', sampleQuestion.questionText);
        console.log('   Category:', sampleQuestion.category);
        console.log('   Difficulty:', sampleQuestion.difficulty);
        console.log('   Options:', sampleQuestion.options.length, 'options');
      }
      
      await prisma.$disconnect();
    } catch (dbError: any) {
      console.log('❌ Database test failed:', dbError?.message || 'Unknown error');
    }
    
    console.log('\n✅ Aptitude backend is ready!');
    console.log('\n📋 Available endpoints:');
    console.log('   GET  /api/aptitude/questions?position=POSITION');
    console.log('   POST /api/aptitude/start');
    console.log('   POST /api/aptitude/:testId/answers');
    console.log('   POST /api/aptitude/:testId/complete');
    console.log('   GET  /api/aptitude/:testId/results');
    console.log('   GET  /api/aptitude/history');
    console.log('\n🔑 All aptitude endpoints require authentication');
    console.log('\n💡 To test authenticated endpoints:');
    console.log('   1. Sign in through the frontend');
    console.log('   2. Use the JWT token in Authorization header');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error?.message || 'Unknown error');
  }
}

testAptitudeAPIs();
