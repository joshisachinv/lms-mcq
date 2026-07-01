import Scratchpad from "@/components/scratchpad/Scratchpad";
import Button from "@/components/ui/Button";

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
  if (!isOpen) return null;

  return (
    <section className="exam-scratchpad-panel">
      <div className="exam-scratchpad-header">
        <h3>Scratchpad</h3>

        <Button type="button" variant="secondary" onClick={onToggleOpen}>
          Hide
        </Button>
      </div>

      <Scratchpad key={questionId} value={value} onChange={onChange} />
    </section>
  );
}