interface ParsedChoice {
  choice_number: number;
  summary: string;
  feedback_text: string;
}

interface ParsedSection {
  section_number: number;
  title: string;
  choices: ParsedChoice[];
}

export interface ParsedExamData {
  sections: ParsedSection[];
}

export function parseEvaluationMarkdown(markdown: string): ParsedExamData {
  const sections: ParsedSection[] = [];
  const lines = markdown.split("\n");

  let currentSection: ParsedSection | null = null;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match section header: ## 評価1: 題材の選び方
    const sectionMatch = trimmed.match(
      /^##\s*評価(\d+)[:\s：]\s*(.+)$/
    );
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        section_number: parseInt(sectionMatch[1]),
        title: sectionMatch[2].trim(),
        choices: [],
      };
      inTable = false;
      continue;
    }

    // Detect table header row
    if (trimmed.startsWith("| 番号") || trimmed.startsWith("|番号")) {
      inTable = true;
      continue;
    }

    // Skip separator row
    if (trimmed.match(/^\|[-\s|]+\|$/)) {
      continue;
    }

    // Parse table row: | 10 | summary | feedback |
    if (inTable && currentSection && trimmed.startsWith("|")) {
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length >= 3) {
        const choiceNumber = parseInt(cells[0]);
        if (!isNaN(choiceNumber)) {
          currentSection.choices.push({
            choice_number: choiceNumber,
            summary: cells[1],
            feedback_text: cells[2],
          });
        }
      }
    }

    // End of table
    if (trimmed === "---" || (trimmed === "" && inTable)) {
      inTable = false;
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return { sections };
}
