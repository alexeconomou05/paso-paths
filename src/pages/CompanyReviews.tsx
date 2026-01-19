import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { Star, MessageSquare, Building2, User, Search, Plus, Trash2, Edit2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Review {
  id: string;
  user_id: string;
  company_name: string;
  employer_id: string | null;
  rating: number;
  title: string;
  review_text: string;
  is_anonymous: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface Company {
  name: string;
  employer_id: string | null;
  review_count: number;
  avg_rating: number;
}

const CompanyReviews = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Form state
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formReviewText, setFormReviewText] = useState("");
  const [formIsAnonymous, setFormIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchReviews();
    
    // Check for company filter in URL params
    const companyParam = searchParams.get("company");
    if (companyParam) {
      setSelectedCompany(companyParam);
      setFormCompanyName(companyParam);
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("company_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch user names for non-anonymous reviews
      const userIds = [...new Set((reviewsData || []).filter(r => !r.is_anonymous).map(r => r.user_id))];
      let profilesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        if (profilesData) {
          profilesMap = Object.fromEntries(profilesData.map(p => [p.id, p.full_name]));
        }
      }

      const reviewsWithProfiles = (reviewsData || []).map(review => ({
        ...review,
        profiles: review.is_anonymous ? null : { full_name: profilesMap[review.user_id] || "User" }
      }));

      setReviews(reviewsWithProfiles);

      // Aggregate companies from reviews
      const companyMap = new Map<string, Company>();
      reviewsWithProfiles.forEach((review) => {
        const existing = companyMap.get(review.company_name);
        if (existing) {
          existing.review_count += 1;
          existing.avg_rating = (existing.avg_rating * (existing.review_count - 1) + review.rating) / existing.review_count;
        } else {
          companyMap.set(review.company_name, {
            name: review.company_name,
            employer_id: review.employer_id,
            review_count: 1,
            avg_rating: review.rating,
          });
        }
      });
      setCompanies(Array.from(companyMap.values()).sort((a, b) => b.review_count - a.review_count));
    } catch (error: any) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormCompanyName("");
    setFormRating(5);
    setFormTitle("");
    setFormReviewText("");
    setFormIsAnonymous(false);
    setEditingReview(null);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please log in to leave a review");
      navigate("/auth");
      return;
    }

    if (!formCompanyName.trim() || !formTitle.trim() || !formReviewText.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview) {
        const { error } = await supabase
          .from("company_reviews")
          .update({
            company_name: formCompanyName.trim(),
            rating: formRating,
            title: formTitle.trim(),
            review_text: formReviewText.trim(),
            is_anonymous: formIsAnonymous,
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        toast.success("Review updated successfully!");
      } else {
        const { error } = await supabase
          .from("company_reviews")
          .insert({
            user_id: user.id,
            company_name: formCompanyName.trim(),
            rating: formRating,
            title: formTitle.trim(),
            review_text: formReviewText.trim(),
            is_anonymous: formIsAnonymous,
          });

        if (error) throw error;
        toast.success("Review submitted successfully!");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const { error } = await supabase
        .from("company_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      toast.success("Review deleted");
      fetchReviews();
    } catch (error: any) {
      toast.error("Failed to delete review");
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setFormCompanyName(review.company_name);
    setFormRating(review.rating);
    setFormTitle(review.title);
    setFormReviewText(review.review_text);
    setFormIsAnonymous(review.is_anonymous);
    setIsDialogOpen(true);
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !selectedCompany || review.company_name === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/jobs" className="text-foreground/70 hover:text-foreground transition-colors">{t('jobs')}</Link>
              <Link to="/company-reviews" className="text-foreground/70 hover:text-foreground transition-colors">Company Reviews</Link>
              <Link to="/about" className="text-foreground/70 hover:text-foreground transition-colors">{t('about')}</Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/student-dashboard")}
                >
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  {t('login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Company Reviews
            </h1>
            <p className="text-muted-foreground mt-1">
              Share your experience and help others make informed decisions
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingReview ? "Edit Review" : "Write a Review"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label>Rating *</Label>
                  <div className="mt-2">
                    {renderStars(formRating, true, setFormRating)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Review Title *</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Summarize your experience"
                  />
                </div>
                <div>
                  <Label htmlFor="review">Your Review *</Label>
                  <Textarea
                    id="review"
                    value={formReviewText}
                    onChange={(e) => setFormReviewText(e.target.value)}
                    placeholder="Share your experience working with this company..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="anonymous"
                    checked={formIsAnonymous}
                    onCheckedChange={setFormIsAnonymous}
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Post anonymously
                  </Label>
                </div>
                <Button 
                  onClick={handleSubmitReview} 
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Submitting..." : editingReview ? "Update Review" : "Submit Review"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies or reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCompany || "all"} onValueChange={(v) => setSelectedCompany(v === "all" ? null : v)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.name} value={company.name}>
                  {company.name} ({company.review_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Stats */}
        {companies.length > 0 && !selectedCompany && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {companies.slice(0, 4).map((company) => (
              <Card 
                key={company.name} 
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedCompany(company.name)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate">{company.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(company.avg_rating))}
                  <span className="text-sm text-muted-foreground">
                    ({company.review_count})
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Selected Company Header */}
        {selectedCompany && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{selectedCompany}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(Math.round(companies.find(c => c.name === selectedCompany)?.avg_rating || 0))}
                    <span className="text-sm text-muted-foreground">
                      {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedCompany(null)}>
                View All
              </Button>
            </div>
          </Card>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCompany 
                ? `Be the first to review ${selectedCompany}!`
                : "Be the first to share your experience!"}
            </p>
            <Button onClick={() => {
              if (selectedCompany) setFormCompanyName(selectedCompany);
              setIsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Write a Review
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span 
                        className="font-medium text-primary cursor-pointer hover:underline"
                        onClick={() => setSelectedCompany(review.company_name)}
                      >
                        {review.company_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                    <p className="text-foreground/80 whitespace-pre-wrap">{review.review_text}</p>
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {review.is_anonymous 
                        ? "Anonymous" 
                        : review.profiles?.full_name || "User"}
                    </div>
                  </div>
                  {user?.id === review.user_id && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditReview(review)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyReviews;
