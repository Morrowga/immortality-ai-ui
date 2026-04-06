interface Props {
  weight:    number
  setWeight: (v: number) => void
  t:         (k: string) => string
}

export function WeightSlider({ weight, setWeight, t }: Props) {
  return (
    <div className="tc-weight">
      <div className="tc-weight-header">
        <span>{t("train.memoryWeight")}</span>
        <span className="tc-weight-val">{weight.toFixed(1)} / 10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={0.1}
        value={weight}
        onChange={e => setWeight(parseFloat(e.target.value))}
      />
      <div className="tc-weight-labels">
        <span>{t("train.minor")}</span>
        <span>{t("train.lifeDefining")}</span>
      </div>
    </div>
  )
}