import {runSystemPatchExperiments} from './system-patch-experiments.mjs';
const report=await runSystemPatchExperiments();
console.log('SYSTEM_PATCH_ACCEPTANCE '+JSON.stringify(report));
