import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import {
  Terminal,
  Cpu,
  Package,
  Wifi,
  HardDrive,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/QuestionCard";
import type { Question, Category } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  terminal: Terminal,
  cpu: Cpu,
  package: Package,
  wifi: Wifi,
  "hard-drive": HardDrive,
  settings: Settings,
  "help-circle": HelpCircle,
};

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: loadingCategory } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
  });

  const { data: questions, isLoading: loadingQuestions } = useQuery<(Question & { category: Category })[]>({
    queryKey: [`/api/questions?category=${slug}`],
    enabled: !!category,
  });

  if (loadingCategory) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Category not found</h2>
        <p className="text-muted-foreground mb-4">
          This category doesn't exist or has been removed.
        </p>
        <Link href="/questions">
          <Button>Browse All Questions</Button>
        </Link>
      </div>
    );
  }

  const Icon = iconMap[category.icon] || HelpCircle;

  return (
    <div className="space-y-6">
      <Link href="/questions">
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          All Questions
        </Button>
      </Link>

      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Icon className="h-8 w-8" style={{ color: category.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions?.length ?? 0} questions in this category
        </p>
        <Link href="/ask">
          <Button size="sm" data-testid="button-ask-in-category">
            Ask Question
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {loadingQuestions ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : questions?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to ask a question in {category.name}!
              </p>
              <Link href="/ask">
                <Button data-testid="button-ask-first-in-category">
                  Ask a Question
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          questions?.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        )}
      </div>
    </div>
  );
}
