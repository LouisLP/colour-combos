import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  // Throwaway prototype code (see prototypes/README.md) — deliberately exempt
  // from the production ruleset. Nothing here ships.
  ignores: ['prototypes/**'],
})
