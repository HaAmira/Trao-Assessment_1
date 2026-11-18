#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const kitPipeline = require('../backend/src/services/pipeline/kitPipeline');

function parseArgs() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[i + 1];
      i++;
    }
  }

  return { inputPath, outputPath };
}

async function runEvaluation() {
  const { inputPath, outputPath } = parseArgs();

  if (!inputPath || !outputPath) {
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const resolvedInput = path.resolve(process.cwd(), inputPath);
  const resolvedOutput = path.resolve(process.cwd(), outputPath);

  if (!fs.existsSync(resolvedInput)) {
    console.error(`Input file not found: ${resolvedInput}`);
    process.exit(1);
  }

  let cases = [];
  try {
    const rawData = fs.readFileSync(resolvedInput, 'utf8');
    cases = JSON.parse(rawData);
    if (!Array.isArray(cases)) {
      cases = [cases];
    }
  } catch (err) {
    console.error(`Failed to parse input JSON file: ${err.message}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`Starting Batch Evaluation`);
  console.log(`Input: ${resolvedInput} (${cases.length} cases)`);
  console.log(`Output: ${resolvedOutput}`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  const outputKits = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < cases.length; i++) {
    const testCase = cases[i];
    const caseName = testCase.company || testCase.companyName || `Case #${i + 1}`;
    console.log(`[Case ${i + 1}/${cases.length}] Processing: ${caseName}...`);

    try {
      const kit = await kitPipeline.generateKit({
        jobDescription: testCase.job_description || testCase.jobDescription || '',
        companyUrl: testCase.company_url || testCase.companyUrl || '',
        companyName: testCase.company || testCase.companyName || '',
        location: testCase.location || 'Remote',
        daysAvailable: testCase.days_available || testCase.daysAvailable || 5,
        allowLocal: true // Support relative links and local company URLs per Appendix B
      });

      outputKits.push(kit);
      successCount++;
      console.log(`  ✓ Successfully generated kit for ${caseName}`);
    } catch (err) {
      failureCount++;
      console.error(`  ✗ Failed case ${caseName}: ${err.message}`);
      // Record error per case and continue
      outputKits.push({
        error: true,
        message: err.message,
        case_index: i,
        source: {
          company: testCase.company || 'Unknown',
          company_url: testCase.company_url || '',
          role: testCase.role || 'Unknown',
          location: testCase.location || '',
          jd_chars: (testCase.job_description || '').length,
          researched_at: new Date().toISOString(),
          pages_used: []
        }
      });
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutput, JSON.stringify(outputKits, null, 2), 'utf8');

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`Batch Evaluation Complete in ${elapsedSeconds}s`);
  console.log(`Total: ${cases.length} | Succeeded: ${successCount} | Failed: ${failureCount}`);
  console.log(`Results written to: ${resolvedOutput}`);
  console.log(`======================================================\n`);
}

runEvaluation();

