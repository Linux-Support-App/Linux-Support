import { useQuery } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { Search, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/QuestionCard";
import { SearchBar } from "@/components/SearchBar";
import type { Question, Category } from "@shared/schema";

export default function SearchResults() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const query = params.get("q") || "";

  const { data: questions, isLoading } = useQuery<(Question & { category: Category })[]>({
    queryKey: [`/api/questions/search?q=${encodeURIComponent(query)}`],
    enabled: !!query,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        {query && (
          <p className="text-muted-foreground">
            Showing results for "<span className="text-foreground font-medium">{query}</span>"
          </p>
        )}
      </div>

      <SearchBar className="max-w-xl" />

      {!query ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Enter a search term</h3>
            <p className="text-muted-foreground">
              Search for questions, topics, or keywords
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : questions?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try different keywords or browse all questions
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/questions">
                <Button variant="outline">
                  Browse Questions
                </Button>
              </Link>
              <Link href="/ask">
                <Button>
                  Ask a Question
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {questions.length} result{questions.length === 1 ? "" : "s"}
          </p>
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
