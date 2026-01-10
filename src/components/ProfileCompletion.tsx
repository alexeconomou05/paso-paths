import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";

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
}

const ProfileCompletion = ({ profile, showDetails = false }: ProfileCompletionProps) => {
  if (!profile) return null;

  const fields: FieldCheck[] = [
    { label: "Full Name", completed: !!profile.full_name?.trim() },
    { label: "University", completed: !!profile.university?.trim() },
    { label: "Field of Study", completed: !!profile.field_of_study?.trim() },
    { label: "Graduation Year", completed: !!profile.graduation_year },
    { label: "Bio & Skills", completed: !!profile.bio?.trim() },
    { label: "Career Interests", completed: !!profile.career_interests?.trim() },
    { label: "Profile Photo", completed: !!profile.photo_url },
    { label: "CV Upload", completed: !!profile.cv_url },
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center gap-2 text-xs">
                {field.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className={field.completed ? 'text-foreground' : 'text-muted-foreground'}>
                  {field.label}
                </span>
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
