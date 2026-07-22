import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  // Throwaway prototype code (see prototypes/README.md) — deliberately exempt
  // from the production ruleset. Nothing here ships.
  ignores: [
    'prototypes/**',
    // Source data, not authored code — formatting it is churn on 149 kB of JSON.
    'src/data/combos.json',
    // Code fences in ADRs and prose are illustrative fragments, not modules;
    // linting them as source files flags things like missing exports.
    '**/*.md/**',
  ],
})
