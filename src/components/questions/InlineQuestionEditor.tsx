import Button from "@/components/ui/Button";

type Props = {
  value: string;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function InlineQuestionEditor({ value, saving, onChange, onSave, onCancel }: Props) {
  return (
    <div className="inline-edit-box">
      <textarea
        className="inline-edit-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus
      />
      <div className="inline-edit-actions">
        <Button variant="primary" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
