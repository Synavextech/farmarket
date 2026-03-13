import africastalking from 'africastalking';

export const sendSMS = async (to: string, message: string): Promise<any> => {
    try {
        const apiKey = process.env.AFRICASTALKING_API_KEY;
        const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';

        if (!apiKey) {
            console.warn('Africa\'s Talking API Key not found. Simulation mode: SMS not sent.');
            return {
                SMSMessageData: { 
                    Message: "Simulated sending", 
                    Recipients: [{ status: "Success", statusCode: 101, number: to, messageId: "sim_123" }] 
                }
            };
        }
        
        const at = africastalking({ apiKey, username });
        const sms = at.SMS;
        
        // Ensure recipient is formatted properly +...
        const result = await sms.send({
            to: [to],
            message,
            from: process.env.AFRICASTALKING_SENDER_ID || ''
        });
        return result;
    } catch (error) {
        console.error('Africa\'s Talking Send Error:', error);
        throw error; // Re-throw so caller can handle or log it
    }
};
