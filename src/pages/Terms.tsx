import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: December 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using GoHire, you accept and agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Eligibility</h2>
            <p className="text-muted-foreground">
              To use GoHire as a student/employee, you must be a currently enrolled university student with a valid PASO (student ID). 
              Employers must be legitimate businesses or organizations with valid registration.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Account Registration</h2>
            <p className="text-muted-foreground">
              You agree to provide accurate, current, and complete information during registration. 
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. User Conduct</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the platform for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Scrape or collect data from the platform without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Job Postings</h2>
            <p className="text-muted-foreground">
              Employers are solely responsible for the accuracy and legality of their job postings. 
              GoHire does not guarantee employment outcomes and is not responsible for any disputes between employers and applicants.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Verification Process</h2>
            <p className="text-muted-foreground">
              All student accounts require PASO verification and admin approval. 
              Employer accounts are subject to review. We reserve the right to reject or suspend accounts that do not meet our verification standards.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on GoHire, including logos, design, and text, is owned by GoHire and protected by intellectual property laws. 
              You may not reproduce or distribute our content without permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              GoHire is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform, 
              including but not limited to employment decisions, data loss, or service interruptions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms at any time. Continued use of GoHire after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at gohire.info@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
