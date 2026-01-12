import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, ChevronRight, HelpCircle, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CodeBlock } from "@/components/CodeBlock";
import { SearchBar } from "@/components/SearchBar";
import type { Faq, Category } from "@shared/schema";

type FaqWithCategory = Faq & { category: Category };

export default function FAQ() {
  const { data: faqs, isLoading } = useQuery<FaqWithCategory[]>({
    queryKey: ["/api/faqs"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const faqsByCategory = faqs?.reduce((acc, faq) => {
    const categoryId = faq.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(faq);
    return acc;
  }, {} as Record<string, FaqWithCategory[]>);

  return (
    <div className="space-y-8">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Quick answers to common Linux problems. Find solutions for installation, 
          configuration, networking, and more.
        </p>
      </div>

      <SearchBar 
        placeholder="Search FAQs..." 
        className="max-w-xl mx-auto"
      />

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !faqs || faqs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No FAQs yet</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for common questions and answers.
            </p>
            <Link href="/questions">
              <Button data-testid="button-browse-questions">
                Browse Questions
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {categories?.map((category) => {
            const categoryFaqs = faqsByCategory?.[category.id];
            if (!categoryFaqs || categoryFaqs.length === 0) return null;

            return (
              <Card key={category.id} data-testid={`faq-section-${category.slug}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span 
                      className="p-1.5 rounded"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <ChevronRight className="h-4 w-4" style={{ color: category.color }} />
                    </span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {categoryFaqs
                      .sort((a, b) => a.order - b.order)
                      .map((faq) => (
                        <AccordionItem 
                          key={faq.id} 
                          value={faq.id}
                          data-testid={`faq-item-${faq.id}`}
                        >
                          <AccordionTrigger className="text-left hover:text-primary">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none pt-2">
                              <p className="whitespace-pre-wrap text-muted-foreground">
                                {faq.answer}
                              </p>
                              {faq.codeSnippet && (
                                <CodeBlock 
                                  code={faq.codeSnippet} 
                                  language={faq.codeLanguage || "bash"} 
                                />
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-primary mb-3" />
          <h3 className="text-xl font-semibold mb-2">Can't find your answer?</h3>
          <p className="text-muted-foreground mb-4">
            Ask the community and get help from Linux experts
          </p>
          <Link href="/ask">
            <Button data-testid="button-ask-question">
              Ask a Question
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
