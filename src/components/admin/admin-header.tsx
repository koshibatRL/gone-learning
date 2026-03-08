import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";

export function AdminHeader() {
  return (
    <header className="border-b bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/exams" className="text-base font-bold tracking-tight">
            論文模擬採点
          </Link>
          <span className="rounded-sm bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-medium">
            管理
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/admin/exams"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            問題管理
          </Link>
          <Link
            href="/admin/import"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            インポート
          </Link>
          <Link
            href="/exams"
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            受験者画面
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
