import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Eye, User, Pin, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/VoteButtons";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useAuth } from "@/contexts/AuthContext";
import type { Question, Category } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionCardProps {
  question: Question & { category?: Category };
}

export function QuestionCard({ question }: QuestionCardProps) {
  const { canModerate } = useAuth();
  const { toast } = useToast();

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

  const pinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/questions/${question.id}/pin`),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: question.isPinned ? "Question unpinned" : "Question pinned",
        description: question.isPinned ? "The question has been unpinned." : "The question has been pinned to the top.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/questions/${question.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Question deleted",
        description: "The question has been removed.",
      });
    },
  });

  const hasMedia = question.imageUrl || question.videoUrl || question.codeSnippet;

  return (
    <Card 
      className={`hover-elevate ${question.isPinned ? "border-primary/50 bg-primary/5" : ""}`} 
      data-testid={`card-question-${question.id}`}
    >
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
              <div className="flex items-center gap-2">
                {question.isPinned && (
                  <Badge variant="outline" className="gap-1 text-primary border-primary/50">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
                <Link href={`/question/${question.id}`}>
                  <h3 
                    className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
                    data-testid="text-question-title"
                  >
                    {question.title}
                  </h3>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                {question.category && (
                  <CategoryBadge category={question.category} />
                )}
                {canModerate && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        pinMutation.mutate();
                      }}
                      disabled={pinMutation.isPending}
                      title={question.isPinned ? "Unpin question" : "Pin question"}
                      data-testid={`button-pin-${question.id}`}
                    >
                      <Pin className={`h-4 w-4 ${question.isPinned ? "text-primary" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Are you sure you want to delete this question?")) {
                          deleteMutation.mutate();
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Delete question"
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${question.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-2 text-muted-foreground text-sm line-clamp-2">
              {question.content.replace(/```[\s\S]*?```/g, "[code snippet]").slice(0, 200)}
              {question.content.length > 200 && "..."}
            </p>

            <div className="mt-3 flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <Link href={question.userId ? `/users/${question.userId}` : "#"}>
                <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <User className="h-3.5 w-3.5" />
                  <span data-testid="text-author">{question.authorName}</span>
                </div>
              </Link>
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
