import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Props = {
  search: string;
  subjectFilter: string;
  topicFilter: string;
  difficultyFilter: string;
  subjects: string[];
  topics: string[];
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onSelectFiltered: () => void;
  onClearFiltered: () => void;
};

export default function QuestionBankFilters({
  search,
  subjectFilter,
  topicFilter,
  difficultyFilter,
  subjects,
  topics,
  onSearchChange,
  onSubjectChange,
  onTopicChange,
  onDifficultyChange,
  onSelectFiltered,
  onClearFiltered,
}: Props) {
  return (
    <FormSection title="Filter Question Bank">
      <div className="form-grid-3">
        <div className="form-span-3">
          <Input
            label="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search subject, topic, difficulty, or question text"
          />
        </div>

        <Select
          label="Subject"
          value={subjectFilter}
          onChange={(e) => onSubjectChange(e.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </Select>

        <Select
          label="Topic"
          value={topicFilter}
          onChange={(e) => onTopicChange(e.target.value)}
        >
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </Select>

        <Select
          label="Difficulty"
          value={difficultyFilter}
          onChange={(e) => onDifficultyChange(e.target.value)}
        >
          <option value="">All difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
          <option value="Difficult">Difficult</option>
        </Select>

        <div className="action-row form-span-3">
          <Button type="button" variant="secondary" onClick={onSelectFiltered}>
            Select Filtered
          </Button>

          <Button type="button" variant="secondary" onClick={onClearFiltered}>
            Clear Filtered
          </Button>
        </div>
      </div>
    </FormSection>
  );
}