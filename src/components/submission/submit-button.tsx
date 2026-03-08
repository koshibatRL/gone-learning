"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubmitButtonProps {
  onSubmit: () => void;
  disabled?: boolean;
  charCount: number;
}

export function SubmitButton({
  onSubmit,
  disabled,
  charCount,
}: SubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const isEmpty = charCount === 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button disabled={disabled || isEmpty} className="w-full" />}
      >
        提出する
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>答案を提出しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            提出後は答案の修正はできません。現在の文字数は{charCount}
            字です。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setOpen(false);
              onSubmit();
            }}
          >
            提出
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
