"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = void 0;
const africastalking_1 = __importDefault(require("africastalking"));
const sendSMS = (to, message) => __awaiter(void 0, void 0, void 0, function* () {
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
        const at = (0, africastalking_1.default)({ apiKey, username });
        const sms = at.SMS;
        // Ensure recipient is formatted properly +...
        const result = yield sms.send({
            to: [to],
            message,
            from: process.env.AFRICASTALKING_SENDER_ID || ''
        });
        return result;
    }
    catch (error) {
        console.error('Africa\'s Talking Send Error:', error);
        throw error; // Re-throw so caller can handle or log it
    }
});
exports.sendSMS = sendSMS;
