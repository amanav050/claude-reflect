/** Reasoning skeleton step label → display name */
export const REASONING_LABEL_NAMES = {
  from_input: 'From your input',
  general_knowledge: 'General knowledge',
  inference: 'Inference',
  assumption: 'Assumption',
}

/** Light-mode tag backgrounds and text (reasoning skeleton) */
export const REASONING_TAG_LIGHT = {
  from_input: 'bg-[#E1F5EE] text-[#085041]',
  general_knowledge: 'bg-[#E6F1FB] text-[#0C447C]',
  inference: 'bg-[#FAEEDA] text-[#633806]',
  assumption: 'bg-[#FCEBEB] text-[#791F1F]',
}

/** Dark-mode tag backgrounds and text (reasoning skeleton) */
export const REASONING_TAG_DARK = {
  from_input: 'bg-[#085041] text-[#9FE1CB]',
  general_knowledge: 'bg-[#0C447C] text-[#85B7EB]',
  inference: 'bg-[#633806] text-[#FAC775]',
  assumption: 'bg-[#791F1F] text-[#F7C1C1]',
}

/** Colored dot for each reasoning step label */
export const REASONING_DOT_COLORS = {
  from_input: 'bg-confidence-green',
  general_knowledge: 'bg-knowledge-blue',
  inference: 'bg-confidence-amber',
  assumption: 'bg-confidence-red',
}

/** Sentence confidence label → dot color */
export const SENTENCE_LABEL_DOT = {
  confident: 'bg-confidence-green',
  inference: 'bg-confidence-amber',
  assumption: 'bg-confidence-red',
  uncertain: 'bg-confidence-amber/70',
}

/** Uncertainty flag severity badge styles */
export const SEVERITY_STYLES = {
  low: 'bg-confidence-green/15 text-confidence-green',
  medium: 'bg-confidence-amber/15 text-confidence-amber',
  high: 'bg-confidence-red/15 text-confidence-red',
}
