"use client";

import { useRef, useCallback, useEffect, useState } from "react";

const COLS = 20;
const CELL_SIZE = 28;

interface EssayEditorProps {
  value: string;
  onChange: (value: string) => void;
  standardCharCount: number;
  disabled?: boolean;
}

function countChars(text: string): number {
  return text.replace(/\n/g, "").length;
}

// テキストをグリッドセル配列に変換（改行で次の行へ）
function textToGridCells(text: string, cols: number): (string | null)[] {
  const cells: (string | null)[] = [];
  for (const ch of text) {
    if (ch === "\n") {
      const remainder = cells.length % cols;
      if (remainder > 0) {
        for (let i = 0; i < cols - remainder; i++) {
          cells.push(null);
        }
      }
    } else {
      cells.push(ch);
    }
  }
  return cells;
}

// テキスト上のカーソル位置をグリッドインデックスに変換
function textPosToGridIndex(text: string, pos: number, cols: number): number {
  let gridIdx = 0;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === "\n") {
      const remainder = gridIdx % cols;
      if (remainder > 0) {
        gridIdx += cols - remainder;
      }
    } else {
      gridIdx++;
    }
  }
  return gridIdx;
}

// グリッドインデックス → テキスト上のカーソル位置
function gridIndexToTextPos(
  text: string,
  targetGridIdx: number,
  cols: number
): number {
  let gridIdx = 0;
  for (let i = 0; i < text.length; i++) {
    if (gridIdx >= targetGridIdx) return i;
    if (text[i] === "\n") {
      const remainder = gridIdx % cols;
      if (remainder > 0) {
        gridIdx += cols - remainder;
      }
    } else {
      gridIdx++;
    }
  }
  return text.length;
}

export function EssayEditor({
  value,
  onChange,
  standardCharCount,
  disabled,
}: EssayEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [focused, setFocused] = useState(false);
  const charCount = countChars(value);
  const ratio = standardCharCount > 0 ? charCount / standardCharCount : 0;

  const gridCells = textToGridCells(value, COLS);
  const cursorGridIdx = textPosToGridIndex(value, cursorPos, COLS);

  const minRows = Math.ceil(standardCharCount / COLS);
  const contentRows = Math.ceil(gridCells.length / COLS) + 2;
  const totalRows = Math.max(minRows, contentRows);

  // Progress bar values
  const progressPercent = Math.min(ratio * 100, 110);
  const isInRange = ratio >= 0.8 && ratio <= 1.1;
  const isTooMany = ratio > 1.1;

  // 初期状態で全角スペースを挿入
  useEffect(() => {
    if (value === "") {
      onChange("\u3000");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = 1;
          setCursorPos(1);
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // カーソル位置のセルが見えるようスクロール
  useEffect(() => {
    if (!focused || !gridRef.current) return;
    const row = Math.floor(cursorGridIdx / COLS);
    const scrollTarget = row * CELL_SIZE;
    const container = gridRef.current.parentElement;
    if (!container) return;
    const { scrollTop, clientHeight } = container;
    if (
      scrollTarget < scrollTop ||
      scrollTarget + CELL_SIZE > scrollTop + clientHeight
    ) {
      container.scrollTop = scrollTarget - clientHeight / 2;
    }
  }, [cursorGridIdx, focused]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;

      if (e.key === "Enter") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const { selectionStart, selectionEnd } = textarea;
        const newValue =
          value.slice(0, selectionStart) +
          "\n\u3000" +
          value.slice(selectionEnd);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd =
            selectionStart + 2;
          setCursorPos(selectionStart + 2);
        });
        return;
      }

      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const currentGridIdx = textPosToGridIndex(
          value,
          textarea.selectionStart,
          COLS
        );
        let nextGridIdx = currentGridIdx;

        if (e.key === "ArrowLeft") {
          nextGridIdx = Math.max(0, currentGridIdx - 1);
        } else if (e.key === "ArrowRight") {
          nextGridIdx = currentGridIdx + 1;
        } else if (e.key === "ArrowUp") {
          nextGridIdx = currentGridIdx - COLS;
        } else if (e.key === "ArrowDown") {
          nextGridIdx = currentGridIdx + COLS;
        }

        if (nextGridIdx < 0) nextGridIdx = 0;

        const newTextPos = gridIndexToTextPos(value, nextGridIdx, COLS);
        const clampedPos = Math.min(newTextPos, value.length);
        textarea.selectionStart = textarea.selectionEnd = clampedPos;
        setCursorPos(clampedPos);
      }
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      setCursorPos(e.target.selectionStart ?? 0);
    },
    [onChange]
  );

  const updateCursor = useCallback(() => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart ?? 0);
    }
  }, []);

  // Row number width
  const ROW_NUM_WIDTH = 32;

  return (
    <div className="space-y-3">
      {/* Character count progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            標準字数: {standardCharCount}字
          </span>
          <span
            className={
              isInRange
                ? "font-medium text-success"
                : charCount === 0
                  ? "text-muted-foreground"
                  : isTooMany
                    ? "font-medium text-destructive"
                    : "font-medium text-warning"
            }
          >
            {charCount}字
            {charCount > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({Math.round(ratio * 100)}%)
              </span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isInRange
                ? "bg-success"
                : isTooMany
                  ? "bg-destructive"
                  : charCount === 0
                    ? "bg-muted-foreground/30"
                    : "bg-warning"
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>0</span>
          <span>{Math.round(standardCharCount * 0.8)}字 (80%)</span>
          <span>{standardCharCount}字</span>
        </div>
      </div>

      {/* Grid editor */}
      <div className="relative">
        <div
          className="custom-scrollbar cursor-text overflow-auto rounded-lg border bg-white shadow-sm"
          style={{ maxHeight: 600 }}
          onClick={(e) => {
            const textarea = textareaRef.current;
            if (!textarea || !gridRef.current) return;
            textarea.focus({ preventScroll: true });
            const rect = gridRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - ROW_NUM_WIDTH;
            const y = e.clientY - rect.top;
            if (x < 0) return;
            const col = Math.min(Math.floor(x / CELL_SIZE), COLS - 1);
            const row = Math.floor(y / CELL_SIZE);
            const gridIdx = row * COLS + Math.max(0, col);
            const newTextPos = gridIndexToTextPos(value, gridIdx, COLS);
            const clampedPos = Math.min(newTextPos, value.length);
            textarea.selectionStart = textarea.selectionEnd = clampedPos;
            setCursorPos(clampedPos);
          }}
        >
          <div
            ref={gridRef}
            className="mx-auto select-none"
            style={{ width: ROW_NUM_WIDTH + COLS * CELL_SIZE }}
          >
            {Array.from({ length: totalRows }, (_, row) => (
              <div key={row} className="flex">
                <div
                  className="flex shrink-0 items-center justify-center text-[10px] text-muted-foreground/40"
                  style={{ width: ROW_NUM_WIDTH, height: CELL_SIZE }}
                >
                  {row + 1}
                </div>
                {Array.from({ length: COLS }, (_, col) => {
                  const i = row * COLS + col;
                  const char = i < gridCells.length ? gridCells[i] : null;
                  const isCursor = focused && i === cursorGridIdx;
                  return (
                    <div
                      key={col}
                      className={`flex shrink-0 items-center justify-center border border-gray-100 ${
                        isCursor ? "bg-blue-100" : ""
                      }`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        fontSize: CELL_SIZE * 0.6,
                      }}
                    >
                      {char ?? ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={updateCursor}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute top-0 left-0 h-0 w-0 resize-none opacity-0"
          style={{ pointerEvents: "none" }}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
