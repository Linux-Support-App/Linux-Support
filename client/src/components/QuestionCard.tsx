import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Eye, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VoteButtons } from "@/components/VoteButtons";
import { CategoryBadge } from "@/components/CategoryBadge";
import type { Question, Category } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QuestionCardProps {
  question: Question & { category?: Category };
}

export function QuestionCard({ question }: QuestionCardProps) {
  const upvoteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/questions/${question.id}/vote`, { direction: "up" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/questions/${question.id}/vote`, { direction: "down" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const hasMedia = question.imageUrl || question.videoUrl || question.codeSnippet;

  return (
    <Card className="hover-elevate" data-testid={`card-question-${question.id}`}>
      <CardContent className="p-0">
        <div className="flex">
          <div className="flex-shrink-0 p-4 border-r border-border">
            <VoteButtons
              votes={question.votes}
              onUpvote={() => upvoteMutation.mutate()}
              onDownvote={() => downvoteMutation.mutate()}
              size="sm"
            />
          </div>

          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <Link href={`/question/${question.id}`}>
                <h3 
                  className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
                  data-testid="text-question-title"
                >
                  {question.title}
                </h3>
              </Link>
              {question.category && (
                <CategoryBadge category={question.category} />
              )}
            </div>

            <p className="mt-2 text-muted-foreground text-sm line-clamp-2">
              {question.content.replace(/```[\s\S]*?```/g, "[code snippet]").slice(0, 200)}
              {question.content.length > 200 && "..."}
            </p>

            <div className="mt-3 flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span data-testid="text-author">{question.authorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{question.answerCount} answers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>{question.viewCount} views</span>
              </div>
              <span className="text-xs">
                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
              </span>
              {hasMedia && (
                <span className="text-xs text-primary font-medium">
                  {question.codeSnippet && "Has code"}
                  {question.imageUrl && " Has image"}
                  {question.videoUrl && " Has video"}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
