import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Code, Image, Video, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const answerSchema = z.object({
  content: z.string().min(10, "Answer must be at least 10 characters"),
  authorName: z.string().min(2, "Name must be at least 2 characters"),
  codeSnippet: z.string().optional(),
  codeLanguage: z.string().optional(),
});

type AnswerFormData = z.infer<typeof answerSchema>;

interface AnswerFormProps {
  questionId: string;
}

const languages = [
  { value: "bash", label: "Bash" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "config", label: "Config File" },
];

export function AnswerForm({ questionId }: AnswerFormProps) {
  const { toast } = useToast();
  const [showCode, setShowCode] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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

  const form = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      content: "",
      authorName: "",
      codeSnippet: "",
      codeLanguage: "bash",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AnswerFormData) =>
      apiRequest("POST", `/api/questions/${questionId}/answers`, {
        ...data,
        imageUrl,
        videoUrl,
      }),
    onSuccess: () => {
      form.reset();
      setShowCode(false);
      setImageUrl(null);
      setVideoUrl(null);
      queryClient.invalidateQueries();
      toast({
        title: "Answer posted!",
        description: "Your answer has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
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

  const onSubmit = (data: AnswerFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card data-testid="card-answer-form">
      <CardHeader>
        <CardTitle className="text-lg">Your Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      data-testid="input-answer-author"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your answer here. Be specific and include examples if possible..."
                      className="min-h-32"
                      {...field}
                      data-testid="input-answer-content"
                    />
                  </FormControl>
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
                    {isUploading ? "Uploading..." : "Add Image"}
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
                      <FormLabel>Code Snippet</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your code here..."
                          className="min-h-24 font-mono text-sm"
                          {...field}
                          data-testid="input-code-snippet"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-submit-answer"
            >
              <Send className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Posting..." : "Post Answer"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
