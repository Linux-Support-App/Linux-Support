import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  CheckCircle, 
  ThumbsUp, 
  Calendar, 
  User,
  Award,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  karma: number;
  level: number;
  title: string | null;
  nextLevelKarma: number | null;
  createdAt: string;
  questionsCount: number;
  answersCount: number;
  questions: Array<{
    id: string;
    title: string;
    votes: number;
    answerCount: number;
    createdAt: string;
    category: { name: string; slug: string };
  }>;
  answers: Array<{
    id: string;
    content: string;
    votes: number;
    isAccepted: boolean;
    createdAt: string;
    question: { id: string; title: string };
  }>;
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "owner": return "destructive";
    case "admin": return "destructive";
    case "moderator": return "secondary";
    default: return "outline";
  }
}

function getTitleColor(title: string | null): string {
  switch (title) {
    case "Apprentice": return "text-emerald-500";
    case "Contributor": return "text-blue-500";
    case "Scholar": return "text-purple-500";
    case "Sage": return "text-amber-500";
    case "Professor": return "text-orange-500";
    default: return "text-muted-foreground";
  }
}

export default function UserProfile() {
  const [, params] = useRoute("/users/:id");
  const userId = params?.id;

  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
            <Link href="/">
              <Button data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const karmaProgress = user.nextLevelKarma 
    ? Math.min((user.karma / user.nextLevelKarma) * 100, 100) 
    : 100;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Link href="/">
        <Button variant="ghost" className="mb-4" data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold" data-testid="text-username">
                    {user.displayName || user.username}
                  </h1>
                  {user.role !== "member" && (
                    <Badge variant={getRoleBadgeVariant(user.role)} data-testid="badge-role">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Joined {format(new Date(user.createdAt), "MMMM yyyy")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Award className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-karma">{user.karma}</p>
                <p className="text-sm text-muted-foreground">Karma Points</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-questions">{user.questionsCount}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-answers">{user.answersCount}</p>
                <p className="text-sm text-muted-foreground">Answers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reputation Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">Level {user.level}</span>
              {user.title && (
                <Badge variant="outline" className={getTitleColor(user.title)} data-testid="badge-title">
                  {user.title}
                </Badge>
              )}
            </div>
            {user.nextLevelKarma && (
              <span className="text-sm text-muted-foreground">
                {user.karma} / {user.nextLevelKarma} karma to next level
              </span>
            )}
          </div>
          <Progress value={karmaProgress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.questions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No questions yet</p>
            ) : (
              <div className="space-y-3">
                {user.questions.map((q) => (
                  <Link key={q.id} href={`/questions/${q.id}`}>
                    <div 
                      className="p-3 rounded-lg hover-elevate cursor-pointer border"
                      data-testid={`question-${q.id}`}
                    >
                      <p className="font-medium line-clamp-2">{q.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> {q.votes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {q.answerCount}
                        </span>
                        <Badge variant="outline" className="text-xs">{q.category.name}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Answers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.answers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No answers yet</p>
            ) : (
              <div className="space-y-3">
                {user.answers.map((a) => (
                  <Link key={a.id} href={`/questions/${a.question.id}`}>
                    <div 
                      className="p-3 rounded-lg hover-elevate cursor-pointer border"
                      data-testid={`answer-${a.id}`}
                    >
                      <p className="font-medium line-clamp-2">{a.question.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> {a.votes}
                        </span>
                        {a.isAccepted && (
                          <Badge variant="default" className="bg-green-500 text-xs">Accepted</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
