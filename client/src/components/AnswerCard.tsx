import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { User, Check, Trash2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteButtons } from "@/components/VoteButtons";
import { MediaPreview } from "@/components/MediaPreview";
import { CodeBlock } from "@/components/CodeBlock";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Answer } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AnswerCardProps {
  answer: Answer;
  questionId: string;
  questionAuthorId?: string | null;
}

export function AnswerCard({ answer, questionId, questionAuthorId }: AnswerCardProps) {
  const { user, canModerate } = useAuth();
  const { toast } = useToast();

  const upvoteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/answers/${answer.id}/vote`, { direction: "up" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/answers/${answer.id}/vote`, { direction: "down" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/answers/${answer.id}/accept`, { questionId }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Answer accepted",
        description: "This answer has been marked as accepted.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/answers/${answer.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Answer deleted",
        description: "The answer has been removed.",
      });
    },
  });

  const canAccept = user && (user.id === questionAuthorId || canModerate);

  return (
    <Card 
      className={`${answer.isAccepted ? "border-primary/50 bg-primary/5" : ""}`}
      data-testid={`card-answer-${answer.id}`}
    >
      <CardContent className="p-0">
        <div className="flex">
          <div className="flex-shrink-0 p-4 border-r border-border">
            <VoteButtons
              votes={answer.votes}
              onUpvote={() => upvoteMutation.mutate()}
              onDownvote={() => downvoteMutation.mutate()}
              size="sm"
            />
            {answer.isAccepted && (
              <div className="mt-2 flex justify-center">
                <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                {answer.isAccepted && (
                  <Badge variant="default" className="mb-3 bg-primary/20 text-primary border-0">
                    Accepted Answer
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {canAccept && !answer.isAccepted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                    title="Accept this answer"
                    className="gap-1 text-primary"
                    data-testid={`button-accept-${answer.id}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Accept</span>
                  </Button>
                )}
                {canModerate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this answer?")) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    title="Delete answer"
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-answer-${answer.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{answer.content}</p>
            </div>

            {answer.codeSnippet && (
              <CodeBlock code={answer.codeSnippet} language={answer.codeLanguage || "bash"} />
            )}

            <MediaPreview imageUrl={answer.imageUrl} videoUrl={answer.videoUrl} />

            <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-sm text-muted-foreground">
              <Link href={answer.userId ? `/users/${answer.userId}` : "#"}>
                <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <User className="h-3.5 w-3.5" />
                  <span data-testid="text-answer-author">{answer.authorName}</span>
                </div>
              </Link>
              <span className="text-xs">
                answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
