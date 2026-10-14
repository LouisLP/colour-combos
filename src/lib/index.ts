// The package entry: catalogue, scale engine and emitters. Single combos import
// on their own as `japanese-colour-combos/<id>`.

export type { Combo, ComboColour, ComboSize } from '../data/combos'
export { COMBO_COUNT, COMBO_SIZES, comboLabel, COMBOS, getCombo, requireCombo } from '../data/combos'
export type { Mode } from '../theme/adapt'
export * from './emit'
export type { ColourFormat, EmitOptions } from './format'
export { COLOUR_FORMATS, formatColour } from './format'
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
