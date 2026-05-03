"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Shield,
  User,
} from "lucide-react";

interface CurrentUser {
  type: "student" | "admin";
  name: string;
  email: string;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    type: "student",
    name: "John Doe",
    email: "jdoe@uoregon.edu",
  });
  const isAdmin = currentUser.type === "admin";

  const handleSwitchRole = () => {
    const nextType = currentUser.type === "admin" ? "student" : "admin";
    setCurrentUser((previous) => ({
      ...previous,
      type: nextType,
    }));
    router.push(nextType === "admin" ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-forest-900/90 backdrop-blur-md text-white shadow-lg print:hidden">
        <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href={isAdmin ? "/admin" : "/"}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">MaxGPA</h1>
              <p className="text-sm text-emerald-300">University of Oregon Grade Analytics</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 md:gap-4">
            {isAdmin ? (
              <Link
                href="/admin"
                className={`rounded-full px-4 py-2 transition-colors ${
                  pathname === "/admin"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-100 hover:bg-forest-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin Portal
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/"
                  className={`rounded-full px-4 py-2 transition-colors ${
                    pathname === "/" || pathname === "/dashboard"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-100 hover:bg-forest-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Student Dashboard
                  </span>
                </Link>
                <Link
                  href="/saved-plans"
                  className={`rounded-full px-4 py-2 transition-colors ${
                    pathname === "/saved-plans"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-100 hover:bg-forest-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    My Plan
                  </span>
                </Link>
              </>
            )}

            <div className="border-white/15 lg:ml-4 lg:border-l lg:pl-4">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-3 rounded-full px-3 py-2 transition-colors hover:bg-forest-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-semibold">
                        {currentUser.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{currentUser.name}</div>
                        <div className="flex items-center gap-1 text-xs text-emerald-300">
                          {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <span className="capitalize">{currentUser.type}</span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-emerald-300" />
                    </div>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={5}
                    className="z-50 min-w-[240px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                  >
                    <div className="border-b border-slate-200 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span className="capitalize">{currentUser.type} Account</span>
                      </div>
                    </div>

                    <DropdownMenu.Item
                      onSelect={handleSwitchRole}
                      className="my-1 flex cursor-pointer items-center gap-3 rounded px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                    >
                      {isAdmin ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      <div className="flex-1">
                        <div>Switch to {isAdmin ? "Student" : "Admin"}</div>
                        <div className="text-xs text-slate-500">Demo mode</div>
                      </div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
