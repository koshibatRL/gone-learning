"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors",
        isActive
          ? "text-primary-foreground"
          : "text-primary-foreground/60 hover:text-primary-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function AdminHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams" className="text-base font-bold tracking-tight">
            論文模擬採点
          </Link>
          <span className="rounded-sm bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-medium">
            管理
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <AdminNavLink href="/admin/exams">問題管理</AdminNavLink>
          <AdminNavLink href="/admin/import">インポート</AdminNavLink>
          <Link
            href="/exams"
            className="text-sm font-medium text-primary-foreground/60 hover:text-primary-foreground"
          >
            受験者画面
          </Link>
          <UserMenu />
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-primary-foreground/80 hover:text-primary-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-primary-foreground/10 px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/admin/exams"
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              問題管理
            </Link>
            <Link
              href="/admin/import"
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              インポート
            </Link>
            <Link
              href="/exams"
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              受験者画面
            </Link>
            <div className="pt-1">
              <UserMenu />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
