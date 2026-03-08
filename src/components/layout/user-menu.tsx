"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="h-8 gap-1.5 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
    >
      <LogOut className="h-4 w-4" />
      <span className="text-sm">ログアウト</span>
    </Button>
  );
}
