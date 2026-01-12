import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, User, MessageCircle, Eye, Share2, Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { VoteButtons } from "@/components/VoteButtons";
import { CategoryBadge } from "@/components/CategoryBadge";
import { MediaPreview } from "@/components/MediaPreview";
import { CodeBlock } from "@/components/CodeBlock";
import { AnswerCard } from "@/components/AnswerCard";
import { AnswerForm } from "@/components/AnswerForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Question, Category, Answer } from "@shared/schema";

type QuestionWithDetails = Question & {
  category: Category;
  answers: Answer[];
};

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: question, isLoading, error } = useQuery<QuestionWithDetails>({
    queryKey: ["/api/questions", id],
  });

  const upvoteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/questions/${id}/vote`, { direction: "up" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/questions/${id}/vote`, { direction: "down" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Question not found</h2>
        <p className="text-muted-foreground mb-4">
          This question may have been removed or doesn't exist.
        </p>
        <Link href="/questions">
          <Button>Browse Questions</Button>
        </Link>
      </div>
    );
  }

  const sortedAnswers = [...(question.answers || [])].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;
    return b.votes - a.votes;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/questions">
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to Questions
        </Button>
      </Link>

      <Card data-testid="card-question-detail">
        <CardContent className="p-0">
          <div className="flex">
            <div className="flex-shrink-0 p-6 border-r border-border">
              <VoteButtons
                votes={question.votes}
                onUpvote={() => upvoteMutation.mutate()}
                onDownvote={() => downvoteMutation.mutate()}
                size="lg"
              />
            </div>

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h1 className="text-2xl font-bold" data-testid="text-question-title">
                  {question.title}
                </h1>
                <CategoryBadge category={question.category} />
              </div>

              <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{question.content}</p>
              </div>

              {question.codeSnippet && (
                <CodeBlock 
                  code={question.codeSnippet} 
                  language={question.codeLanguage || "bash"} 
                />
              )}

              <MediaPreview 
                imageUrl={question.imageUrl} 
                videoUrl={question.videoUrl} 
              />

              <Separator className="my-6" />

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span data-testid="text-author">{question.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{question.viewCount} views</span>
                  </div>
                  <span>
                    asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" data-testid="button-share">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-bookmark">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Bookmark
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          {sortedAnswers.length} {sortedAnswers.length === 1 ? "Answer" : "Answers"}
        </h2>

        {sortedAnswers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No answers yet. Be the first to help!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedAnswers.map((answer) => (
              <AnswerCard 
                key={answer.id} 
                answer={answer} 
                questionId={question.id}
                questionAuthorId={question.userId}
              />
            ))}
          </div>
        )}
      </div>

      <AnswerForm questionId={question.id} />
    </div>
  );
}
