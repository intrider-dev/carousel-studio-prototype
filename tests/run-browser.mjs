import { spawnSync } from 'node:child_process'
const session = `checks-${Date.now()}`
function run(args) {
  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes','--package','@playwright/cli','playwright-cli',`-s=${session}`,...args], { encoding:'utf8',shell:process.platform==='win32',maxBuffer:8_000_000 })
  const output=(result.stdout||'')+(result.stderr||'')
  if(result.status!==0 || output.includes('### Error')) throw new Error(output)
  const summary=output.match(/### Result\s*([\s\S]*?)(?=###|$)/)
  console.log(summary?summary[1].trim():`${args[0]}: passed`)
}
try {
  run(['open','http://localhost:3080'])
  run(['run-code','--filename','tests/critical-regression.js'])
  run(['run-code','--filename','tests/resilience-regression.js'])
  run(['run-code','--filename','tests/editor-interactions.js'])
  run(['run-code','--filename','tests/production-workflow.js'])
  run(['run-code','--filename','tests/design-regression.js'])
} catch(error) {
  run(['snapshot'])
  run(['screenshot','--filename','output/playwright/check-failure.png'])
  throw error
} finally { run(['close']) }
