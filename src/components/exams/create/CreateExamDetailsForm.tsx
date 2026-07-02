import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

type Props = {
  title: string;
  description: string;
  overallTimerSeconds: number;
  randomizeQuestions: boolean;
  isTimed: boolean;
  viewMode: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onOverallTimerChange: (value: number) => void;
  onRandomizeQuestionsChange: (value: boolean) => void;
  onIsTimedChange: (value: boolean) => void;
  onViewModeChange: (value: string) => void;
};

export default function CreateExamDetailsForm({
  title,
  description,
  overallTimerSeconds,
  randomizeQuestions,
  isTimed,
  viewMode,
  onTitleChange,
  onDescriptionChange,
  onOverallTimerChange,
  onRandomizeQuestionsChange,
  onIsTimedChange,
  onViewModeChange,
}: Props) {
  return (
    <FormSection title="Exam Details">
      <div className="form-grid-3">
        <div className="form-span-2">
          <Input
            label="Exam Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <Input
          label="Overall Timer Seconds"
          type="number"
          value={overallTimerSeconds}
          onChange={(e) => onOverallTimerChange(Number(e.target.value))}
        />

        <div className="form-span-3">
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <Select
          label="Randomize Questions"
          value={randomizeQuestions ? "yes" : "no"}
          onChange={(e) =>
            onRandomizeQuestionsChange(e.target.value === "yes")
          }
        >
          <option value="no">No - Use selected order</option>
          <option value="yes">Yes - Randomize for student</option>
        </Select>

        <Select
          label="Timing Mode"
          value={isTimed ? "timed" : "untimed"}
          onChange={(e) => onIsTimedChange(e.target.value === "timed")}
        >
          <option value="timed">Timed - enforce time limits</option>
          <option value="untimed">Untimed - track time only</option>
        </Select>

        <Select
          label="View"
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value)}
        >
          <option value="all">All Questions</option>
          <option value="selected">Selected Questions - Exam Order</option>
          <option value="unselected">Unselected Questions</option>
        </Select>
      </div>
    </FormSection>
  );
}