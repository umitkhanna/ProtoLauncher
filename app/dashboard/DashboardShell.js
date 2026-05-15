"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Kanban,
  LayoutDashboard,
  ListChecks,
  ListOrdered,
  ListTree,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { ProductPreviewDrawer } from "@/app/dashboard/ProductPreviewDrawer";

const PROJECTS_BASE = "/dashboard/projects";
const LS_LAST_PROJECT = "pl:lastProjectId";
const LS_EXPANDED = "pl:expandedProjects";
const SS_OPEN_NEW = "pl:openNewProject";

/** /dashboard/projects/123/... → "123" */
function projectIdFromPathname(pathname) {
  const m = /^\/dashboard\/projects\/(\d+)(?:\/|$)/.exec(pathname || "");
  return m ? m[1] : null;
}

function sidebarHeaderTitle(pathname) {
  if (pathname === "/dashboard") return "Overview";
  if (pathname.startsWith("/dashboard/requirements")) return "Requirements";
  if (/\/projects\/\d+\/product-backlog/.test(pathname)) return "Product backlog";
  if (pathname.includes("/projects/backlog")) return "Sprint planning";
  if (pathname.includes("/projects/board")) return "Sprint board";
  if (pathname.startsWith("/dashboard/admin")) return "Admin";
  if (pathname.startsWith("/dashboard/manager")) return "Manager";
  if (pathname.startsWith("/dashboard/client")) return "Your team";
  if (pathname.includes("/projects/") && pathname.includes("/messages")) return "Messages";
  if (pathname.startsWith("/dashboard/projects")) return "Projects";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}

function topNavLinkClass(href, pathname) {
  const isOverview = href === "/dashboard";
  const active = isOverview
    ? pathname === "/dashboard"
    : href === "/dashboard/requirements/edit"
      ? pathname.startsWith("/dashboard/requirements")
      : href === "/dashboard/settings"
        ? pathname.startsWith("/dashboard/settings")
        : href === "/dashboard/admin/users"
          ? pathname.startsWith("/dashboard/admin")
          : href === "/dashboard/manager/team"
            ? pathname.startsWith("/dashboard/manager")
            : href === "/dashboard/client/team"
              ? pathname.startsWith("/dashboard/client")
              : false;

  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
    active
      ? "bg-white/[0.08] text-white shadow-inner shadow-black/20"
      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
  ].join(" ");
}

function projectsParentButtonClass(pathname, projectsOpen) {
  const underProjects =
    pathname === PROJECTS_BASE ||
    pathname.startsWith(`${PROJECTS_BASE}/`) ||
    pathname.startsWith(`${PROJECTS_BASE}?`);
  const active =
    underProjects &&
    !pathname.startsWith("/dashboard/requirements") &&
    !pathname.startsWith("/dashboard/settings") &&
    !pathname.startsWith("/dashboard/admin") &&
    !pathname.startsWith("/dashboard/manager") &&
    !pathname.startsWith("/dashboard/client");

  return [
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
    active && projectsOpen
      ? "bg-white/[0.06] text-zinc-100"
      : active
        ? "bg-white/[0.08] text-white shadow-inner shadow-black/20"
        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
  ].join(" ");
}

function projectMenuLinkClass(active) {
  return [
    "flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-[13px] font-medium transition",
    active
      ? "bg-violet-500/15 text-violet-100"
      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
  ].join(" ");
}

function loadExpandedFromStorage(validIds) {
  try {
    const raw = localStorage.getItem(LS_EXPANDED);
    if (!raw) return null;
    const arr = JSON.parse(raw).filter((id) => validIds.has(String(id)));
    return arr.length ? new Set(arr) : null;
  } catch {
    return null;
  }
}

function persistExpanded(set) {
  try {
    localStorage.setItem(LS_EXPANDED, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function DashboardShell({ user, children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const projectIdFromPath = useMemo(
    () => projectIdFromPathname(pathname),
    [pathname],
  );
  const projectIdFromQuery = searchParams.get("projectId");
  const resolvedProjectId = projectIdFromPath || projectIdFromQuery || null;

  const [projectsOpen, setProjectsOpen] = useState(() =>
    pathname.startsWith(PROJECTS_BASE),
  );
  const [sidebarProjects, setSidebarProjects] = useState([]);
  const [expandedProjectIds, setExpandedProjectIds] = useState(() => new Set());
  const lastProjectIdsKeyRef = useRef("");

  const projectIdsKey = useMemo(
    () => (sidebarProjects || []).map((p) => p.id).join(","),
    [sidebarProjects],
  );

  useEffect(() => {
    if (resolvedProjectId) {
      try {
        localStorage.setItem(LS_LAST_PROJECT, String(resolvedProjectId));
      } catch {
        /* ignore */
      }
    }
  }, [resolvedProjectId]);

  useEffect(() => {
    if (!resolvedProjectId) return;
    setExpandedProjectIds((prev) => {
      const id = String(resolvedProjectId);
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistExpanded(next);
      return next;
    });
  }, [resolvedProjectId]);

  useEffect(() => {
    if (pathname.startsWith(PROJECTS_BASE)) setProjectsOpen(true);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/projects", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setSidebarProjects(data.projects || []);
      } catch {
        if (!cancelled) setSidebarProjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!sidebarProjects.length) {
      setExpandedProjectIds(new Set());
      lastProjectIdsKeyRef.current = "";
      return;
    }

    const validIds = new Set(sidebarProjects.map((p) => String(p.id)));

    try {
      const pending = sessionStorage.getItem(SS_OPEN_NEW);
      if (pending) {
        if (validIds.has(pending)) {
          sessionStorage.removeItem(SS_OPEN_NEW);
          setExpandedProjectIds(new Set([pending]));
          persistExpanded(new Set([pending]));
          lastProjectIdsKeyRef.current = projectIdsKey;
          return;
        }
        return;
      }
    } catch {
      /* ignore */
    }

    if (projectIdsKey === lastProjectIdsKeyRef.current) return;
    lastProjectIdsKeyRef.current = projectIdsKey;

    const fromStore =
      typeof window !== "undefined" ? loadExpandedFromStorage(validIds) : null;
    if (fromStore && fromStore.size > 0) {
      setExpandedProjectIds(fromStore);
      return;
    }

    let last = null;
    try {
      last = localStorage.getItem(LS_LAST_PROJECT);
    } catch {
      /* ignore */
    }
    if (last && validIds.has(last)) {
      setExpandedProjectIds(new Set([last]));
      return;
    }

    setExpandedProjectIds(new Set([String(sidebarProjects[0].id)]));
  }, [sidebarProjects, projectIdsKey]);

  const toggleProjectExpanded = useCallback((pid) => {
    const id = String(pid);
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistExpanded(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const display = user.name?.trim() || user.email || "Account";

  const headerTitle = sidebarHeaderTitle(pathname);

  const linkWorkspaceActive = (pid) =>
    pathname === PROJECTS_BASE &&
    searchParams.get("projectId") === String(pid);
  const linkBacklogActive = (pid) =>
    new RegExp(`^/dashboard/projects/${pid}/product-backlog`).test(pathname);
  const linkPlanningActive = (pid) =>
    (pathname === `${PROJECTS_BASE}/backlog` ||
      pathname.startsWith(`${PROJECTS_BASE}/backlog`)) &&
    searchParams.get("projectId") === String(pid);
  const linkMessagesActive = (pid) =>
    new RegExp(`^/dashboard/projects/${pid}/messages`).test(pathname);
  const linkBoardActive = (pid) =>
    (pathname === `${PROJECTS_BASE}/board` ||
      pathname.startsWith(`${PROJECTS_BASE}/board`)) &&
    searchParams.get("projectId") === String(pid);

  const role = user?.role || "client";

  return (
    <div className="relative z-10 flex min-h-screen">
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="dashboard-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-full w-[min(21rem,calc(100vw-3rem))] flex-col border-r border-white/[0.07] bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:bg-zinc-950/75 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4">
          <Link
            href="/"
            className="truncate text-sm font-semibold tracking-tight text-zinc-100 transition hover:text-white"
          >
            ProtoLauncher
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Menu
          </p>

          <Link
            href="/dashboard"
            className={topNavLinkClass("/dashboard", pathname)}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Overview
          </Link>

          {role === "client" ? (
            <Link
              href="/dashboard/requirements/edit"
              className={topNavLinkClass("/dashboard/requirements/edit", pathname)}
              onClick={() => setSidebarOpen(false)}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Requirements
            </Link>
          ) : null}

          {role === "admin" ? (
            <Link
              href="/dashboard/admin/users"
              className={topNavLinkClass("/dashboard/admin/users", pathname)}
              onClick={() => setSidebarOpen(false)}
            >
              <Shield className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Admin · Users
            </Link>
          ) : null}

          {role === "admin" || role === "manager" ? (
            <Link
              href="/dashboard/manager/team"
              className={topNavLinkClass("/dashboard/manager/team", pathname)}
              onClick={() => setSidebarOpen(false)}
            >
              <Users className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Manager · Team
            </Link>
          ) : null}

          {role === "client" ? (
            <Link
              href="/dashboard/client/team"
              className={topNavLinkClass("/dashboard/client/team", pathname)}
              onClick={() => setSidebarOpen(false)}
            >
              <UserPlus className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              Your collaborators
            </Link>
          ) : null}

          <div className="rounded-xl">
            <button
              type="button"
              className={projectsParentButtonClass(pathname, projectsOpen)}
              aria-expanded={projectsOpen}
              onClick={() => setProjectsOpen((o) => !o)}
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${
                  projectsOpen ? "rotate-0" : "-rotate-90"
                }`}
                aria-hidden
              />
              <FolderKanban className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-left">Projects</span>
            </button>

            {projectsOpen ? (
              <div
                className="mt-0.5 space-y-1 border-l border-white/[0.08] pb-1 pl-2 pt-1"
                role="group"
                aria-label="Projects"
              >
                {sidebarProjects.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-zinc-500">No projects yet.</p>
                ) : (
                  sidebarProjects.map((p) => {
                    const pid = String(p.id);
                    const open = expandedProjectIds.has(pid);
                    const hub = `${PROJECTS_BASE}?projectId=${encodeURIComponent(pid)}`;
                    const backlog = `${PROJECTS_BASE}/${pid}/product-backlog`;
                    const planning = `${PROJECTS_BASE}/backlog?projectId=${encodeURIComponent(pid)}`;
                    const board = `${PROJECTS_BASE}/board?projectId=${encodeURIComponent(pid)}`;
                    const messages = `${PROJECTS_BASE}/${pid}/messages`;
                    const isContext = resolvedProjectId === pid;
                    return (
                      <div key={p.id} className="rounded-lg">
                        <button
                          type="button"
                          className={[
                            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition",
                            isContext
                              ? "bg-white/[0.06] text-zinc-100"
                              : "text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-100",
                          ].join(" ")}
                          aria-expanded={open}
                          onClick={() => toggleProjectExpanded(pid)}
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${
                              open ? "rotate-0" : "-rotate-90"
                            }`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate" title={p.name}>
                            {p.name}
                          </span>
                        </button>
                        {open ? (
                          <div
                            className="ml-2 mt-0.5 space-y-0.5 border-l border-white/[0.06] py-1 pl-2"
                            role="group"
                            aria-label={`${p.name} shortcuts`}
                          >
                            <Link
                              href={hub}
                              className={projectMenuLinkClass(linkWorkspaceActive(pid))}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <ListTree className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              Workspace
                            </Link>
                            <Link
                              href={backlog}
                              className={projectMenuLinkClass(linkBacklogActive(pid))}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <ListChecks className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              Product backlog
                            </Link>
                            <Link
                              href={planning}
                              className={projectMenuLinkClass(linkPlanningActive(pid))}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <ListOrdered className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              Sprint planning
                            </Link>
                            <Link
                              href={board}
                              className={projectMenuLinkClass(linkBoardActive(pid))}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <Kanban className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              Sprint board
                            </Link>
                            <Link
                              href={messages}
                              className={projectMenuLinkClass(linkMessagesActive(pid))}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              Messages
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}

                {(role === "client" || role === "admin") ? (
                <div className="ml-1 border-t border-white/[0.06] pt-2">
                  <Link
                    href={`${PROJECTS_BASE}/new`}
                    className={projectMenuLinkClass(
                      pathname === `${PROJECTS_BASE}/new`,
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    New project
                  </Link>
                </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <Link
            href="/dashboard/settings"
            className={topNavLinkClass("/dashboard/settings", pathname)}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Settings
          </Link>

          <div className="my-3 border-t border-white/[0.06]" />
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
            onClick={() => setSidebarOpen(false)}
          >
            <Home className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Marketing site
          </Link>
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <p className="truncate px-1 text-xs font-medium text-zinc-300" title={user.email}>
            {display}
          </p>
          <p className="mt-0.5 truncate px-1 text-[11px] text-zinc-500" title={user.email}>
            {user.email}
          </p>
          <Link
            href="/logout"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/15 hover:bg-white/[0.06]"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Link>
        </div>
      </aside>

      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <ProductPreviewDrawer projectId={resolvedProjectId} />
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-zinc-950/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 lg:hidden"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{headerTitle}</p>
            <p className="truncate text-xs text-zinc-500">Signed in as {user.email}</p>
          </div>

          <ThemeToggle />
        </header>

        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
