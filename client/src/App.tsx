import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import Home from "@/pages/Home";
import Questions from "@/pages/Questions";
import QuestionDetail from "@/pages/QuestionDetail";
import AskQuestion from "@/pages/AskQuestion";
import FAQ from "@/pages/FAQ";
import CategoryPage from "@/pages/CategoryPage";
import SearchResults from "@/pages/SearchResults";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminPanel from "@/pages/AdminPanel";
import UserProfile from "@/pages/UserProfile";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/questions" component={Questions} />
      <Route path="/question/:id" component={QuestionDetail} />
      <Route path="/ask" component={AskQuestion} />
      <Route path="/faq" component={FAQ} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search" component={SearchResults} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/users/:id" component={UserProfile} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-3">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <SearchBar className="hidden sm:block w-64 lg:w-80" />
                    </div>
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <div className="container max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
                      <Router />
                    </div>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
