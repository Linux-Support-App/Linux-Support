import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoteButtonsProps {
  votes: number;
  onUpvote: () => void;
  onDownvote: () => void;
  vertical?: boolean;
  size?: "sm" | "default" | "lg";
}

export function VoteButtons({
  votes,
  onUpvote,
  onDownvote,
  vertical = true,
  size = "default",
}: VoteButtonsProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUpvote}
          className="h-8 w-8"
          data-testid="button-upvote"
        >
          <ChevronUp className={iconSize} />
        </Button>
        <span className={`font-semibold ${textSize} ${votes > 0 ? "text-primary" : votes < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {votes}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDownvote}
          className="h-8 w-8"
          data-testid="button-downvote"
        >
          <ChevronDown className={iconSize} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onUpvote}
        className="h-8 w-8"
        data-testid="button-upvote"
      >
        <ChevronUp className={iconSize} />
      </Button>
      <span className={`font-semibold ${textSize} ${votes > 0 ? "text-primary" : votes < 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {votes}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDownvote}
        className="h-8 w-8"
        data-testid="button-downvote"
      >
        <ChevronDown className={iconSize} />
      </Button>
    </div>
  );
}
