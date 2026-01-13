import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Terminal,
  Cpu,
  Package,
  Wifi,
  HardDrive,
  Settings,
  HelpCircle,
  Home,
  MessageCircleQuestion,
  BookOpen,
  PlusCircle,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@shared/schema";
import { getKarmaLevel } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  terminal: Terminal,
  cpu: Cpu,
  package: Package,
  wifi: Wifi,
  "hard-drive": HardDrive,
  settings: Settings,
  "help-circle": HelpCircle,
};

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "All Questions", url: "/questions", icon: MessageCircleQuestion },
  { title: "FAQ", url: "/faq", icon: BookOpen },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, canManageUsers, isLoading: authLoading } = useAuth();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Terminal className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">LinuxHelp</h1>
            <p className="text-xs text-sidebar-foreground/60">Community Forum</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Categories
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </SidebarMenuItem>
                ))
              ) : (
                categories?.map((category) => {
                  const Icon = iconMap[category.icon] || HelpCircle;
                  const isActive = location === `/category/${category.slug}`;
                  return (
                    <SidebarMenuItem key={category.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-category-${category.slug}`}
                      >
                        <Link href={`/category/${category.slug}`}>
                          <Icon className="h-4 w-4" />
                          <span>{category.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canManageUsers && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/admin"}
                      data-testid="nav-admin"
                    >
                      <Link href="/admin">
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {authLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : user ? (
          <>
            <Link href={`/users/${user.id}`}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sidebar-accent/50 hover-elevate cursor-pointer" data-testid="sidebar-user-profile">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                  <div className="flex items-center gap-1.5">
                    {getKarmaLevel(user.karma).title ? (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {getKarmaLevel(user.karma).title}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Level {getKarmaLevel(user.karma).level}</span>
                    )}
                    {user.role !== "member" && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/ask" className="block">
              <SidebarMenuButton
                className="w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-ask-question"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Ask Question</span>
              </SidebarMenuButton>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Link href="/login" className="block">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                data-testid="button-login"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button
                className="w-full justify-start gap-2"
                data-testid="button-register"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
