import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send, Code, Image, Video, X, HelpCircle, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useAuth } from "@/contexts/AuthContext";
import type { Category } from "@shared/schema";

const questionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  authorName: z.string().min(2, "Name must be at least 2 characters"),
  codeSnippet: z.string().optional(),
  codeLanguage: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const languages = [
  { value: "bash", label: "Bash / Shell" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "config", label: "Config File" },
];

export default function AskQuestion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-6 w-6" />
              Login Required
            </CardTitle>
            <CardDescription>
              You need to be logged in to ask a question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please login or create an account to post questions and participate in the community.
            </p>
            <div className="flex gap-4">
              <Link href="/login">
                <Button data-testid="button-login">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" data-testid="button-register">Create Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const ext = response.metadata.name.split('.').pop()?.toLowerCase();
      if (['mp4', 'webm', 'mov'].includes(ext || '')) {
        setVideoUrl(response.objectPath);
      } else {
        setImageUrl(response.objectPath);
      }
    },
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: "",
      authorName: "",
      codeSnippet: "",
      codeLanguage: "bash",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: QuestionFormData) =>
      apiRequest<{ id: string }>("POST", "/api/questions", {
        ...data,
        imageUrl,
        videoUrl,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      toast({
        title: "Question posted!",
        description: "Your question has been submitted successfully.",
      });
      setLocation(`/question/${result.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const onSubmit = (data: QuestionFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/questions">
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to Questions
        </Button>
      </Link>

      <Card data-testid="card-ask-question">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Get help from the Linux community
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your name" 
                        {...field} 
                        data-testid="input-author-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., How do I fix 'permission denied' error when running apt update?"
                        {...field}
                        data-testid="input-question-title"
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific and imagine you're asking a question to another person
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your problem in detail. Include what you've tried, error messages, and your system information if relevant..."
                        className="min-h-40"
                        {...field}
                        data-testid="input-question-content"
                      />
                    </FormControl>
                    <FormDescription>
                      Include all the information someone would need to answer your question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={showCode ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                  data-testid="button-toggle-code"
                >
                  <Code className="h-4 w-4 mr-1" />
                  Add Code
                </Button>
                <label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={isUploading}
                  >
                    <span>
                      <Image className="h-4 w-4 mr-1" />
                      {isUploading ? "Uploading..." : "Add Screenshot"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-image-upload"
                  />
                </label>
                <label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={isUploading}
                  >
                    <span>
                      <Video className="h-4 w-4 mr-1" />
                      Add Video
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-video-upload"
                  />
                </label>
              </div>

              {(imageUrl || videoUrl) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {imageUrl && (
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                      <Image className="h-3 w-3" />
                      <span>Image attached</span>
                      <button 
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {videoUrl && (
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                      <Video className="h-3 w-3" />
                      <span>Video attached</span>
                      <button 
                        type="button"
                        onClick={() => setVideoUrl(null)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showCode && (
                <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
                  <FormField
                    control={form.control}
                    name="codeLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-code-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codeSnippet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code / Error Output</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your code, terminal commands, or error messages here..."
                            className="min-h-32 font-mono text-sm"
                            {...field}
                            data-testid="input-code-snippet"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  data-testid="button-submit-question"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {mutation.isPending ? "Posting..." : "Post Question"}
                </Button>
                <Link href="/questions">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
