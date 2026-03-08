export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "examinee";
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  prompt_text: string;
  standard_char_count: number;
  created_by: string;
  created_at: string;
}

export interface EvaluationSection {
  id: string;
  exam_id: string;
  section_number: number;
  title: string;
}

export interface EvaluationChoice {
  id: string;
  section_id: string;
  choice_number: number;
  summary: string;
  feedback_text: string;
}

export interface Submission {
  id: string;
  exam_id: string;
  user_id: string;
  answer_text: string;
  char_count: number;
  status: "pending" | "evaluating" | "evaluated" | "error";
  error_message: string | null;
  submitted_at: string;
  evaluated_at: string | null;
}

export interface SubmissionResult {
  id: string;
  submission_id: string;
  section_id: string;
  selected_choice_id: string;
  section_title: string | null;
  section_number: number | null;
  choice_summary: string | null;
  choice_feedback_text: string | null;
  selected_choice_number: number | null;
  created_at: string;
}

export interface EvaluationSectionWithChoices extends EvaluationSection {
  evaluation_choices: EvaluationChoice[];
}

export interface SubmissionResultWithDetails extends SubmissionResult {
  evaluation_sections: EvaluationSection;
  evaluation_choices: EvaluationChoice;
}
