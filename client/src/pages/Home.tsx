import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TrendingUp, Clock, MessageCircle, ArrowRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/QuestionCard";
import { SearchBar } from "@/components/SearchBar";
import type { Question, Category } from "@shared/schema";

export default function Home() {
  const { data: recentQuestions, isLoading: loadingRecent } = useQuery<(Question & { category: Category })[]>({
    queryKey: ["/api/questions?limit=5&sort=recent"],
  });

  const { data: topQuestions, isLoading: loadingTop } = useQuery<(Question & { category: Category })[]>({
    queryKey: ["/api/questions?limit=5&sort=top"],
  });

  const { data: stats } = useQuery<{ totalQuestions: number; totalAnswers: number; totalUsers: number }>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to <span className="text-primary">LinuxHelp</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Get help with Linux-related problems from our community of experts. 
          Browse common questions or ask your own.
        </p>
        <SearchBar 
          placeholder="Search for solutions..." 
          className="max-w-xl mx-auto"
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalQuestions ?? "-"}</p>
              <p className="text-sm text-muted-foreground">Questions Asked</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalAnswers ?? "-"}</p>
              <p className="text-sm text-muted-foreground">Answers Provided</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalUsers ?? "-"}</p>
              <p className="text-sm text-muted-foreground">Community Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Questions
            </h2>
            <Link href="/questions?sort=recent">
              <Button variant="ghost" size="sm" data-testid="link-view-all-recent">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {loadingRecent ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : recentQuestions?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
                  <Link href="/ask">
                    <Button className="mt-4" data-testid="button-ask-first">
                      Ask a Question
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              recentQuestions?.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Questions
            </h2>
            <Link href="/questions?sort=top">
              <Button variant="ghost" size="sm" data-testid="link-view-all-top">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {loadingTop ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : topQuestions?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No top questions yet.</p>
                </CardContent>
              </Card>
            ) : (
              topQuestions?.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="text-center py-8 border-t border-border">
        <h2 className="text-2xl font-semibold mb-3">Can't find what you're looking for?</h2>
        <p className="text-muted-foreground mb-4">
          Check our FAQ section or ask the community directly
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/faq">
            <Button variant="outline" data-testid="link-browse-faq">
              Browse FAQ
            </Button>
          </Link>
          <Link href="/ask">
            <Button data-testid="link-ask-question">
              Ask a Question
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
