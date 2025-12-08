import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
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

        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: December 2024
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground">
              GoHire ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
            <p className="text-muted-foreground">We collect the following types of information:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Name, email, password, university, field of study, graduation year</li>
              <li><strong>Profile Information:</strong> Bio, photo, CV, career interests, PASO number and document</li>
              <li><strong>Employer Information:</strong> Company name, contact details, website, description</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, interactions with job postings</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use your information to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide and improve our job matching services</li>
              <li>Verify your student or employer status</li>
              <li>Connect you with relevant job opportunities</li>
              <li>Share your profile with employers when you apply for jobs</li>
              <li>Send important notifications about your account and applications</li>
              <li>Analyze and improve our platform</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Information Sharing</h2>
            <p className="text-muted-foreground">We share your information:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>With Employers:</strong> When you apply for a job, your profile and CV are shared with the employer</li>
              <li><strong>With Service Providers:</strong> Third-party services that help us operate our platform</li>
              <li><strong>For Legal Compliance:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className="text-muted-foreground">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate security measures to protect your personal information, including encryption, 
              secure servers, and access controls. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as your account is active or as needed to provide services. 
              You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to enhance your experience, analyze usage, and remember your preferences. 
              You can manage cookie settings in your browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              GoHire is intended for university students and employers. We do not knowingly collect information from children under 18.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or your personal data, contact us at gohire.info@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
