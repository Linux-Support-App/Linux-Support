import { formatDistanceToNow } from "date-fns";
import { User, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/VoteButtons";
import { MediaPreview } from "@/components/MediaPreview";
import { CodeBlock } from "@/components/CodeBlock";
import type { Answer } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AnswerCardProps {
  answer: Answer;
  questionId: string;
}

export function AnswerCard({ answer, questionId }: AnswerCardProps) {
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
            {answer.isAccepted && (
              <Badge variant="default" className="mb-3 bg-primary/20 text-primary border-0">
                Accepted Answer
              </Badge>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{answer.content}</p>
            </div>

            {answer.codeSnippet && (
              <CodeBlock code={answer.codeSnippet} language={answer.codeLanguage || "bash"} />
            )}

            <MediaPreview imageUrl={answer.imageUrl} videoUrl={answer.videoUrl} />

            <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span data-testid="text-answer-author">{answer.authorName}</span>
              </div>
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
