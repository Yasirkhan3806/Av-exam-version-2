import axios from "axios";

export const verifyTurnstileToken = async (token) => {
  const secretKey = process.env.CLOUDFLARE_SECRET_KEY;
  if (!secretKey) {
    console.warn(
      "Cloudflare Secret Key is not set. Skipping Turnstile verification.",
    );
    return true; // fail-open if key is missing to avoid locking out users during dev
  }

  try {
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        secret: secretKey,
        response: token,
      },
    );

    return response.data.success;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
};
