/**
 * Script to list available Gemini models
 * Run with: npx ts-node scripts/list-gemini-models.ts
 */

import { listGeminiModels } from '../src/utils/helper.utils';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
    console.log('\nUsage:');
    console.log('  GEMINI_API_KEY=your-api-key npx ts-node scripts/list-gemini-models.ts');
    process.exit(1);
  }

  console.log('Fetching available Gemini models...\n');
  const result = await listGeminiModels(apiKey);

  if (result.error) {
    console.error('Error:', result.error);
    process.exit(1);
  }

  if (!result.models || result.models.length === 0) {
    console.log('No models found.');
    process.exit(0);
  }

  console.log('Available Gemini Models:\n');
  console.log('='.repeat(80));

  // Filter models that support generateContent
  const generateContentModels = result.models.filter((model) =>
    model.supportedGenerationMethods?.includes('generateContent'),
  );

  if (generateContentModels.length === 0) {
    console.log('\n⚠️  No models found that support generateContent method.\n');
  } else {
    console.log('\n✅ Models that support generateContent:\n');
    generateContentModels.forEach((model) => {
      const modelName = model.name.replace('models/', '');
      console.log(`  • ${modelName}`);
      console.log(`    Display Name: ${model.displayName || 'N/A'}`);
      console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\nAll Available Models:\n');
  result.models.forEach((model) => {
    const modelName = model.name.replace('models/', '');
    console.log(`  • ${modelName}`);
    console.log(`    Display Name: ${model.displayName || 'N/A'}`);
    console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
    console.log('');
  });

  // Recommend a model
  const recommendedModel = generateContentModels.find((m) =>
    m.name.includes('gemini-1.5-flash'),
  ) || generateContentModels.find((m) => m.name.includes('gemini-pro')) ||
    generateContentModels[0];

  if (recommendedModel) {
    const recommendedName = recommendedModel.name.replace('models/', '');
    console.log('='.repeat(80));
    console.log(`\n💡 Recommended model: ${recommendedName}`);
    console.log(`   Use this in your requests: "ai_model": "${recommendedName}"`);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
