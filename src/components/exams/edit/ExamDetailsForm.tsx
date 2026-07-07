import { Exam } from "@/lib/examService";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

type Props = {
  exam: Exam;
  viewMode: string;
  onViewModeChange: (value: string) => void;
  onUpdateField: (
    field: keyof Exam,
    value: string | number | boolean | string[]
  ) => void;
};

export default function ExamDetailsForm({
  exam,
  viewMode,
  onViewModeChange,
  onUpdateField,
}: Props) {
  return (
    <FormSection title="Exam Details">
      <div className="form-grid-3">
        <div className="form-span-2">
          <Input
            label="Exam Title"
            value={exam.title}
            onChange={(e) => onUpdateField("title", e.target.value)}
          />
        </div>

        <Input
          label="Overall Timer Seconds"
          type="number"
          value={exam.overallTimerSeconds}
          onChange={(e) =>
            onUpdateField("overallTimerSeconds", Number(e.target.value))
          }
        />

        <div className="form-span-3">
          <Textarea
            label="Description"
            value={exam.description}
            onChange={(e) => onUpdateField("description", e.target.value)}
          />
        </div>

        <Select
          label="Randomize Questions"
          value={exam.randomizeQuestions ? "yes" : "no"}
          onChange={(e) =>
            onUpdateField("randomizeQuestions", e.target.value === "yes")
          }
        >
          <option value="no">No - Use manual order</option>
          <option value="yes">Yes - Randomize for student</option>
        </Select>

        <Select
          label="Timing Mode"
          value={exam.isTimed ? "timed" : "untimed"}
          onChange={(e) =>
            onUpdateField("isTimed", e.target.value === "timed")
          }
        >
          <option value="timed">Timed - enforce time limits</option>
          <option value="untimed">Untimed - track time only</option>
        </Select>
        
        <Select
            label="View"
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value)}
          >
            <option value="selected">Selected Questions - Exam Order</option>
            <option value="all">All Questions</option>
            <option value="unselected">Unselected Questions</option>
        </Select>
      
      </div>
    </FormSection>
  );
}