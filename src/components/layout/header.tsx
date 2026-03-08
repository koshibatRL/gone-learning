import Link from "next/link";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  role?: "admin" | "examinee";
}

export function Header({ role }: HeaderProps) {
  return (
    <header className="border-b bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/exams" className="text-base font-bold tracking-tight">
          論文模擬採点
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/exams"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            問題一覧
          </Link>
          <Link
            href="/history"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            提出履歴
          </Link>
          {role === "admin" && (
            <Link
              href="/admin/exams"
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
            >
              管理画面
            </Link>
          )}
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
