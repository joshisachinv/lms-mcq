import Button from "@/components/ui/Button";

type Props = {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export default function ExamEditActions({ saving, onSave, onCancel }: Props) {
  return (
    <div className="action-row">
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}