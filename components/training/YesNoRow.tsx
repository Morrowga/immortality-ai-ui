interface Props {
  onYes:     () => void
  onNo:      () => void
  yesLabel?: string
  noLabel?:  string
}

export function YesNoRow({ onYes, onNo, yesLabel = "Yes, save it", noLabel = "No, re-enter" }: Props) {
  return (
    <div className="tc-yesno">
      <button className="tc-yn-btn yes" onClick={onYes}>{yesLabel}</button>
      <button className="tc-yn-btn"     onClick={onNo}>{noLabel}</button>
    </div>
  )
}