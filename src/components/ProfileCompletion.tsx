import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileCompletionProps {
  profile: {
    full_name?: string | null;
    university?: string | null;
    field_of_study?: string | null;
    graduation_year?: number | null;
    bio?: string | null;
    career_interests?: string | null;
    photo_url?: string | null;
    cv_url?: string | null;
  } | null;
  showDetails?: boolean;
}

interface FieldCheck {
  label: string;
  completed: boolean;
  tip: string;
}

const ProfileCompletion = ({ profile, showDetails = false }: ProfileCompletionProps) => {
  if (!profile) return null;

  const fields: FieldCheck[] = [
    { label: "Full Name", completed: !!profile.full_name?.trim(), tip: "Add your full name so employers know who you are" },
    { label: "University", completed: !!profile.university?.trim(), tip: "Specify your university to match with relevant opportunities" },
    { label: "Field of Study", completed: !!profile.field_of_study?.trim(), tip: "Your major helps us recommend field-specific jobs" },
    { label: "Graduation Year", completed: !!profile.graduation_year, tip: "Helps employers find candidates at the right career stage" },
    { label: "Bio & Skills", completed: !!profile.bio?.trim(), tip: "Highlight your technical skills and experiences" },
    { label: "Career Interests", completed: !!profile.career_interests?.trim(), tip: "Describe your dream role for better job matches" },
    { label: "Profile Photo", completed: !!profile.photo_url, tip: "Profiles with photos get 40% more employer views" },
    { label: "CV Upload", completed: !!profile.cv_url, tip: "Upload your CV to apply for jobs instantly" },
  ];

  const completedCount = fields.filter(f => f.completed).length;
  const percentage = Math.round((completedCount / fields.length) * 100);

  const getProgressColor = () => {
    if (percentage < 40) return "bg-destructive";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Profile Completion</span>
          <span className={`text-sm font-bold ${percentage === 100 ? 'text-green-500' : ''}`}>
            {percentage}%
          </span>
        </div>
        <div className="relative">
          <Progress value={percentage} className="h-2" />
          <div 
            className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {showDetails && (
          <div className="mt-4 space-y-2">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center justify-between gap-2 text-xs p-2 rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  {field.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={field.completed ? 'text-foreground' : 'text-muted-foreground'}>
                    {field.label}
                  </span>
                </div>
                {!field.completed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-primary cursor-help">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tip</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px]">
                      <p>{field.tip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        )}
        
        {percentage < 100 && !showDetails && (
          <p className="text-xs text-muted-foreground mt-2">
            Complete your profile to improve job matches
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;
