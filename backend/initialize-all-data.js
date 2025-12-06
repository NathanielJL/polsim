/**
 * Master Initialization Script
 * Populates ALL required data for POLSIM
 */

const { spawn } = require('child_process');
const path = require('path');

const scripts = [
  { name: 'Population Distribution', file: 'run-population-distribution.js' },
  { name: 'Economic System', file: 'run-economic-init-expanded.js' },
  { name: 'Demographic Slices', file: 'populate-demographic-slices.js' },
];

async function runScript(scriptPath, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 Running: ${name}`);
    console.log(`${'='.repeat(80)}\n`);

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${name} completed successfully\n`);
        resolve();
      } else {
        console.error(`\n❌ ${name} failed with code ${code}\n`);
        reject(new Error(`${name} failed`));
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ Error running ${name}:`, err.message, '\n');
      reject(err);
    });
  });
}

async function initializeAll() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                  POLSIM Master Initialization Script                      ║
║                                                                            ║
║  This will populate all required data for the game to function properly   ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  const startTime = Date.now();

  try {
    for (const script of scripts) {
      const scriptPath = path.join(__dirname, script.file);
      await runScript(scriptPath, script.name);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                    ✅ INITIALIZATION COMPLETE! ✅                          ║
║                                                                            ║
║  Time elapsed: ${elapsed} seconds                                              ║
║                                                                            ║
║  Your game database is now ready to use!                                  ║
║  Start the backend with: npm run dev                                      ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                    ❌ INITIALIZATION FAILED ❌                             ║
║                                                                            ║
║  Error: ${error.message}                                                      ║
║                                                                            ║
║  Please check the error messages above and try again.                     ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }
}

initializeAll();
