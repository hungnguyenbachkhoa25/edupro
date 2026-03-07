import { useState } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTests } from "@/hooks/use-tests";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Star, Filter } from "lucide-react";

const CATEGORIES = ["All", "IELTS", "SAT", "THPTQG", "DGNL"];

export default function Practice() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data: tests = [], isLoading } = useTests(selectedCategory === "All" ? undefined : selectedCategory);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Practice Library</h1>
          <p className="text-muted-foreground mt-2 text-lg">Select a test below to start practicing.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 text-muted-foreground mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="rounded-3xl border-none shadow-sm animate-pulse">
                <div className="h-40 bg-muted rounded-t-3xl"></div>
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => (
              <Card key={test.id} className="rounded-3xl border border-border/50 shadow-lg shadow-black/5 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-background p-6 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-none shadow-sm text-xs px-3 py-1">
                      {test.category}
                    </Badge>
                    {test.isPremium && (
                      <Badge className="bg-yellow-400 text-yellow-950 border-none shadow-sm text-xs px-3 py-1 hover:bg-yellow-500 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Premium
                      </Badge>
                    )}
                  </div>
                  <BookOpen className="w-10 h-10 text-primary opacity-50 absolute bottom-[-10px] right-6 transform rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500" />
                </div>
                
                <CardHeader className="pt-6 pb-2">
                  <h3 className="font-display font-bold text-xl line-clamp-2">{test.title}</h3>
                </CardHeader>
                <CardContent className="text-muted-foreground flex-1">
                  <div className="flex items-center gap-4 text-sm mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {test.durationMinutes} mins
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {test.type}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 pb-6">
                  <Button asChild className="w-full rounded-xl h-11 text-base shadow-sm group-hover:shadow-md transition-all">
                    <Link href={`/practice/${test.id}`}>Start Test</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
