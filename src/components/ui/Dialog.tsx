import type { ReactNode } from "react";
import Button from "./Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
};

export default function Dialog({
  open,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          {description && <p>{description}</p>}
        </div>

        {children && <div className="dialog-body">{children}</div>}

        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
