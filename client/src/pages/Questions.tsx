import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Link } from "wouter";
import { MessageCircle, Filter, SortAsc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionCard } from "@/components/QuestionCard";
import { SearchBar } from "@/components/SearchBar";
import type { Question, Category } from "@shared/schema";

export default function Questions() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sort = params.get("sort") || "recent";
  const [, setLocation] = useLocation();

  const { data: questions, isLoading } = useQuery<(Question & { category: Category })[]>({
    queryKey: [`/api/questions?sort=${sort}`],
  });

  const handleSortChange = (value: string) => {
    setLocation(`/questions?sort=${value}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Questions</h1>
          <p className="text-muted-foreground mt-1">
            {questions?.length ?? 0} questions in total
          </p>
        </div>
        <Link href="/ask">
          <Button data-testid="button-ask-question-header">
            Ask Question
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar className="flex-1" />
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="top">Most Votes</SelectItem>
              <SelectItem value="active">Most Active</SelectItem>
              <SelectItem value="unanswered">Unanswered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-16">
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : questions?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to start a discussion!
              </p>
              <Link href="/ask">
                <Button data-testid="button-ask-first-question">
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
