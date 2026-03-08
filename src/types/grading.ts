export interface GradingResultItem {
  section: number;
  choice_number: number;
}

export interface GradingResponse {
  results: GradingResultItem[];
}

export interface GradingError {
  code: "INVALID_JSON" | "INVALID_STRUCTURE" | "API_ERROR" | "TIMEOUT";
  message: string;
}
