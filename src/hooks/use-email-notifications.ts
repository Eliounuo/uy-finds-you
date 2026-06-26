import { useCallback } from "react";
import { emailService } from "@/lib/email";
import { welcomeTemplate } from "@/lib/email/templates/welcome";
import { newOfferTemplate } from "@/lib/email/templates/new_offer";
import { bookingConfirmedTemplate } from "@/lib/email/templates/booking_confirmed";
import { checkInReminderTemplate } from "@/lib/email/templates/checkin_reminder";
import { reviewRequestTemplate } from "@/lib/email/templates/review_request";
import { verificationStatusTemplate } from "@/lib/email/templates/verification_status";

const appUrl =
  (typeof window !== "undefined" ? window.location.origin : undefined) || "https://yurta.app";

export function useEmailNotifications() {
  const sendWelcomeEmail = useCallback(
    (to: string, name?: string) => {
      const t = welcomeTemplate({ name, appUrl });
      return emailService.send({ to, subject: t.subject, html: t.html });
    },
    [],
  );

  const sendNewOfferEmail = useCallback(
    (to: string, args: { tenantName?: string; propertyTitle: string; price: number }) => {
      const t = newOfferTemplate({ ...args, appUrl });
      return emailService.send({ to, subject: t.subject, html: t.html });
    },
    [],
  );

  const sendBookingConfirmedEmail = useCallback(
    (
      to: string,
      args: { propertyTitle: string; checkIn: string; checkOut: string; total: number },
    ) => {
      const t = bookingConfirmedTemplate({ ...args, appUrl });
      return emailService.send({ to, subject: t.subject, html: t.html });
    },
    [],
  );

  const sendCheckInReminderEmail = useCallback(
    (
      to: string,
      args: { propertyTitle: string; address?: string; checkIn: string; hostPhone?: string },
    ) => {
      const t = checkInReminderTemplate({ ...args, appUrl });
      return emailService.send({ to, subject: t.subject, html: t.html });
    },
    [],
  );

  const sendReviewRequestEmail = useCallback(
    (to: string, args: { propertyTitle: string; bookingId: string }) => {
      const t = reviewRequestTemplate({ ...args, appUrl });
      return emailService.send({ to, subject: t.subject, html: t.html });
    },
    [],
  );

  const sendVerificationStatusEmail = useCallback(
    (to: string, args: { approved: boolean; reason?: string }) => {
      const t = verificationStatusTemplate({ ...args, appUrl });
      return emailService.send({ to, subject: t.subject, html: t.html });
    },
    [],
  );

  return {
    sendWelcomeEmail,
    sendNewOfferEmail,
    sendBookingConfirmedEmail,
    sendCheckInReminderEmail,
    sendReviewRequestEmail,
    sendVerificationStatusEmail,
  };
}
