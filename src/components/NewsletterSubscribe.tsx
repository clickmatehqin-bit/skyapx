import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/api/newsletter";

interface NewsletterSubscribeProps {
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  buttonText?: string;
}

/**
 * Reusable newsletter signup wired to the backend. Renders exactly the
 * input + button structure each page already uses.
 */
export function NewsletterSubscribe({
  inputClassName = "",
  buttonClassName = "",
  placeholder = "Your email address",
  buttonText = "Subscribe",
}: NewsletterSubscribeProps) {
  const subscribeFn = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await subscribeFn({ data: { email: email.trim() } });
      if (result.ok) {
        toast.success("Subscribed! Thank you for joining our newsletter.");
        setEmail("");
      } else {
        toast.error(result.message ?? "Could not subscribe, please try again.");
      }
    } catch {
      toast.error("Could not subscribe, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubscribe();
          }
        }}
        placeholder={placeholder}
        className={inputClassName}
      />
      <button onClick={handleSubscribe} disabled={isSubmitting} className={buttonClassName}>
        {isSubmitting ? "Subscribing..." : buttonText}
      </button>
    </>
  );
}
