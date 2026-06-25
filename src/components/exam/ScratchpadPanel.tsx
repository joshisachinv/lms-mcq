import Scratchpad from "@/components/scratchpad/Scratchpad";

type Props = {
  questionId: string;
  value: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onChange: (value: string) => void;
};

export default function ScratchpadPanel({
  questionId,
  value,
  isOpen,
  onToggleOpen,
  onChange,
}: Props) {
  return (
    <aside className="exam-scratchpad-panel">
      <div className="exam-scratchpad-header">
        <h3>Scratchpad</h3>

        <button type="button" className="secondary-button" onClick={onToggleOpen}>
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <Scratchpad
          key={questionId}
          value={value}
          onChange={onChange}
        />
      )}
    </aside>
  );
}