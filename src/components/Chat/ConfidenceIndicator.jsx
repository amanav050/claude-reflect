import { SENTENCE_LABEL_DOT } from '../../utils/constants.js'

const LABEL_TITLES = {
  confident: 'Confident',
  inference: 'Inference',
  assumption: 'Assumption',
  uncertain: 'Uncertain',
}

function ConfidenceIndicator({ label, sentenceId, onSentenceClick }) {
  const dotClass = SENTENCE_LABEL_DOT[label] ?? SENTENCE_LABEL_DOT.confident
  const title = LABEL_TITLES[label] ?? label

  return (
    <button
      type="button"
      onClick={() => onSentenceClick?.(sentenceId)}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center align-middle shrink-0 p-0 mx-0.5 border-0 bg-transparent cursor-pointer min-w-[20px] min-h-[20px]"
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass}`}
        aria-hidden="true"
      />
    </button>
  )
}

export default ConfidenceIndicator
