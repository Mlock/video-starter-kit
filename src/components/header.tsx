"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { AuthDialog } from "./auth-dialog";
import { useAuth } from "@/contexts/auth-context";
import { signOut } from "@/lib/auth";

export default function Header({
  openKeyDialog,
}: {
  openKeyDialog?: () => void;
}) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="px-4 py-2 flex justify-between items-center border-b border-border">
        <h1 className="text-lg font-medium">
          <Logo />
        </h1>
        <nav className="flex flex-row items-center justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="https://fal.ai" target="_blank" rel="noopener noreferrer">
              fal.ai
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/fal-ai-community/video-starter-kit"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuthDialogOpen(true)}
            >
              Sign In
            </Button>
          )}
          {process.env.NEXT_PUBLIC_CUSTOM_KEY && openKeyDialog && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openKeyDialog}
            >
              {typeof localStorage !== "undefined" &&
                !localStorage?.getItem("falKey") && (
                  <span className="dark:bg-orange-400 bg-orange-600 w-2 h-2 rounded-full absolute top-1 right-1"></span>
                )}
              <SettingsIcon className="w-6 h-6" />
            </Button>
          )}
        </nav>
      </header>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
