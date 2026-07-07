import Button from "@/components/ui/Button";

type Props = {
  imageUrl: string;
  title: string;
  editable?: boolean;
  uploading?: boolean;
  onClose: () => void;
  onReplace?: (file: File | null) => void;
  onRemove?: () => void;
};

export default function ImagePreviewModal({
  imageUrl,
  title,
  editable = true,
  uploading = false,
  onClose,
  onReplace,
  onRemove,
}: Props) {
  return (
    <div className="image-modal-backdrop" role="dialog" aria-modal="true">
      <div className="image-modal-card">
        <div className="image-modal-header">
          <strong>{title}</strong>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>

        <div className="image-modal-body">
          <img src={imageUrl} alt={title} className="question-image-zoom" />
        </div>

        {editable && (
          <div className="image-modal-actions">
            <label className="button secondary-button image-replace-label">
              {uploading ? "Uploading..." : "Replace Image"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={(event) => onReplace?.(event.target.files?.[0] || null)}
              />
            </label>
            <Button variant="danger" onClick={onRemove} disabled={uploading}>Remove Image</Button>
          </div>
        )}
      </div>
    </div>
  );
}
