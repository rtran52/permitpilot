import twilio from "twilio";

// Lazy-initialize so the client isn't constructed at module load time
// (avoids build errors when env vars are not set)
function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

const FROM = () => process.env.TWILIO_FROM_NUMBER!;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL!;

export async function sendDocumentRequestSms({
  to,
  homeownerName,
  docLabel,
  token,
}: {
  to: string;
  homeownerName: string;
  docLabel: string;
  token: string;
}) {
  const uploadUrl = `${APP_URL()}/upload/${token}`;
  const body =
    `Hi ${homeownerName}, your roofing contractor needs one more document to pull your permit: ` +
    `"${docLabel}". Please upload it here: ${uploadUrl} ` +
    `(link expires in 72 hours)`;

  return getTwilioClient().messages.create({ to, from: FROM(), body });
}

export async function sendPermitApprovedSms({
  to,
  homeownerName,
  permitNumber,
}: {
  to: string;
  homeownerName: string;
  permitNumber: string | null;
}) {
  const body =
    `Hi ${homeownerName}, great news — your roofing permit has been approved` +
    (permitNumber ? ` (Permit #${permitNumber})` : "") +
    `. Your contractor will be in touch to schedule the start date.`;

  return getTwilioClient().messages.create({ to, from: FROM(), body });
}
