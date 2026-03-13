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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("./db");
const middleware_1 = require("./middleware");
const pdf_1 = require("./pdf");
const sms_1 = require("./sms");
const router = (0, express_1.Router)();
// Create Deposit (Admin/Operator Only)
router.post('/', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, weight_kg, quality_grade, notes } = req.body;
        const operator_id = req.user.id;
        if (!user_id || !weight_kg) {
            return res.status(400).json({ error: 'User ID and Weight are required' });
        }
        // Fetch User Info
        const { data: member, error: memberErr } = yield db_1.supabase
            .from('users')
            .select('*')
            .eq('id', user_id)
            .single();
        if (memberErr || !member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        // 1. Insert Initial Deposit (status pending, no receipt URL yet)
        const { data: deposit, error: insertErr } = yield db_1.supabase
            .from('coffee_deposits')
            .insert([{
                user_id,
                operator_id,
                weight_kg,
                quality_grade,
                notes,
                status: 'completed'
            }])
            .select()
            .single();
        if (insertErr) {
            return res.status(500).json({ error: 'Failed to record deposit' });
        }
        let pdfUrl = '';
        try {
            pdfUrl = yield (0, pdf_1.generatePdfReceipt)(Object.assign(Object.assign({}, deposit), { user_name: member.full_name, phone_number: member.phone_number, national_id: member.national_id, operator_name: req.user.name || 'Admin' }));
            // Update the deposit with receipt URL
            yield db_1.supabase.from('coffee_deposits').update({ receipt_url: pdfUrl }).eq('id', deposit.id);
            deposit.receipt_url = pdfUrl;
        }
        catch (pdfErr) {
            console.error("PDF Gen Error:", pdfErr);
            // Non-fatal, admin can retry generating pdf later
        }
        // 3. Send SMS notification
        let smsStatus = 'failed';
        try {
            const msg = `SIMOTWET COFFEE SOCIETY: Hello ${member.full_name}, ${weight_kg} Kg of coffee has been deposited to your account. Receipt available in your dashboard securely.`;
            const smsResp = yield (0, sms_1.sendSMS)(member.phone_number, msg);
            smsStatus = 'sent';
            // Determine AT's status per recipient if needed, but 'sent' generally means queued to AT
        }
        catch (smsErr) {
            console.error("SMS Sending Error:", smsErr);
            smsStatus = 'failed';
        }
        // Log SMS explicitly
        yield db_1.supabase.from('sms_logs').insert([{
                user_id: member.id,
                phone_number: member.phone_number,
                message: `Deposit ${weight_kg}kg SMS`,
                status: smsStatus
            }]);
        return res.status(201).json({
            message: 'Deposit logged successfully',
            deposit,
            sms_status: smsStatus
        });
    }
    catch (error) {
        console.error("Deposit creation flow error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// List Deposits (Members see own, Admins see all)
router.get('/', middleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isAdmin = ['admin', 'operator'].includes(req.user.role);
        let query = db_1.supabase.from('coffee_deposits').select(`
            *,
            users:user_id(full_name, phone_number)
        `).order('created_at', { ascending: false });
        if (!isAdmin) {
            query = query.eq('user_id', req.user.id);
        }
        const { data, error } = yield query;
        if (error)
            return res.status(500).json({ error: 'Failed to fetch deposits' });
        return res.json(data);
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
}));
exports.default = router;
