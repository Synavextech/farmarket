import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface WebhookPayload {
  user: {
    id: string;
    phone: string;
    email?: string;
  };
  email?: {
    otp: string;
  };
  phone?: {
    otp: string;
  };
}

serve(async (req) => {
  try {
    const signature = req.headers.get("x-supabase-signature");

    // Optional: Validate the signature using the Webhook Secret if configured.
    // For now, assume it's valid if reaching the internal function.
    
    const payload: WebhookPayload = await req.json();

    // We only care about Phone OTPs
    if (payload.phone?.otp && payload.user?.phone) {
      const otp = payload.phone.otp;
      const phoneNumber = payload.user.phone; // Should be e.g. +254...

      // Make request to Africa's Talking API
      const apiKey = Deno.env.get("AFRICASTALKING_API_KEY");
      const username = Deno.env.get("AFRICASTALKING_USERNAME") || "sandbox";
      const senderId = Deno.env.get("AFRICASTALKING_SENDER_ID");

      if (!apiKey) {
        console.warn("No Africa's Talking API key found in Deno Edge Env. Simulating.");
        return new Response(JSON.stringify({ simulated: true, to: phoneNumber, otp }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = new URLSearchParams();
      body.append("username", username);
      body.append("to", phoneNumber);
      body.append("message", `Your SIMOTWET COFFEE SOCIETY verification code is: ${otp}`);
      if (senderId) {
          body.append("from", senderId);
      }

      console.log(`Sending SMS to ${phoneNumber}`);

      const response = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "apiKey": apiKey
        },
        body: body.toString()
      });

      const data = await response.json();
      console.log("Africa's Talking Response:", data);

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ message: "No phone OTP required" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("SMS Sender Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
})
