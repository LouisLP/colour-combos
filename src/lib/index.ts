// The package entry point (`colour-combos`): the catalogue, the scale engine
// and every export format. A single combo's scale is importable on its own as
// `colour-combos/<id>` without any of this; see `scripts/build-lib.ts`.

export type { Combo, ComboColour, ComboSize } from '../data/combos'
export { COMBO_COUNT, COMBO_SIZES, comboLabel, COMBOS, getCombo, requireCombo } from '../data/combos'
export type { Mode } from '../theme/adapt'
export * from './emit'
export type {
  ColourRamp,
  ColourValue,
  ComboScale,
  CoreRoleName,
  NeutralRamp,
  OptionalRoleName,
  RampSteps,
  RoleName,
  SemanticRoles,
  Step,
} from './scale'
export { buildScale, STEPS } from './scale'
