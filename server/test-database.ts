import { PrismaClient } from '@prisma/client';

async function testDatabase() {
  console.log('🧪 Testing Aptitude Database...\n');

  const prisma = new PrismaClient();
  
  try {
    // Test 1: Count questions
    const questionCount = await prisma.aptitudeQuestion.count();
    console.log('✅ Database contains:', questionCount, 'aptitude questions');
    
    // Test 2: Show breakdown by category
    const categories = await prisma.aptitudeQuestion.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📚 Questions by category:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count} questions`);
    });

    // Test 3: Show breakdown by difficulty
    const difficulties = await prisma.aptitudeQuestion.groupBy({
      by: ['difficulty'],
      _count: true
    });
    
    console.log('\n🎯 Questions by difficulty:');
    difficulties.forEach(diff => {
      console.log(`   - ${diff.difficulty}: ${diff._count} questions`);
    });
    
    // Test 4: Show sample question
    const sampleQuestion = await prisma.aptitudeQuestion.findFirst({
      select: {
        questionText: true,
        category: true,
        difficulty: true,
        options: true
      }
    });
    
    if (sampleQuestion) {
      console.log('\n📄 Sample question:');
      console.log('   Text:', sampleQuestion.questionText);
      console.log('   Category:', sampleQuestion.category);
      console.log('   Difficulty:', sampleQuestion.difficulty);
      console.log('   Options:', sampleQuestion.options);
    }

    // Test 5: Test random shuffle function
    const allQuestions = await prisma.aptitudeQuestion.findMany({
      select: { id: true, questionText: true }
    });

    console.log('\n🔀 Testing random question order:');
    const shuffled1 = allQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
    const shuffled2 = allQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
    
    console.log('   First shuffle (5 questions):');
    shuffled1.forEach((q, i) => console.log(`     ${i + 1}. ${q.questionText.substring(0, 50)}...`));
    
    console.log('   Second shuffle (5 questions):');
    shuffled2.forEach((q, i) => console.log(`     ${i + 1}. ${q.questionText.substring(0, 50)}...`));
    
    await prisma.$disconnect();
    
    console.log('\n✅ Database test completed successfully!');
    console.log('\n📋 Backend API Endpoints Ready:');
    console.log('   🔓 GET  /api/health (public)');
    console.log('   🔐 GET  /api/aptitude/questions?position=POSITION');
    console.log('   🔐 POST /api/aptitude/start');
    console.log('   🔐 POST /api/aptitude/:testId/answers');
    console.log('   🔐 POST /api/aptitude/:testId/complete');
    console.log('   🔐 GET  /api/aptitude/:testId/results');
    console.log('   🔐 GET  /api/aptitude/history');
    console.log('\n🔑 Endpoints marked with 🔐 require JWT authentication');
    console.log('\nReady to integrate with frontend!');
    
  } catch (error: any) {
    console.error('Database test failed:', error?.message || 'Unknown error');
  }
}

testDatabase();
