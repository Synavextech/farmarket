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
const uuid_1 = require("uuid");
const sms_1 = require("./sms");
const router = (0, express_1.Router)();
// Generate Aggregate Report PDF (Individual or Company-wide)
router.get('/', middleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type, scope, user_id } = req.query; // type: 'daily', 'weekly', 'monthly', 'annual', 'all'; scope: 'individual', 'company'
        const isAdmin = ['admin', 'operator'].includes(req.user.role);
        let targetUserId = req.user.id;
        if (isAdmin && scope === 'individual' && user_id) {
            targetUserId = user_id;
        }
        let query = db_1.supabase
            .from('coffee_deposits')
            .select(`
                *,
                users:user_id(full_name, phone_number, national_id)
            `)
            .order('created_at', { ascending: true });
        // Scope Handling
        if (scope === 'company' && isAdmin) {
            // No user_id filter for company-wide admin reports
        }
        else {
            query = query.eq('user_id', targetUserId);
        }
        // Time Filter Handling
        const now = new Date();
        if (type === 'daily') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.gte('created_at', today.toISOString());
        }
        else if (type === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            query = query.gte('created_at', lastWeek.toISOString());
        }
        else if (type === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            query = query.gte('created_at', lastMonth.toISOString());
        }
        else if (type === 'annual') {
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            query = query.gte('created_at', lastYear.toISOString());
        }
        const { data: deposits, error } = yield query;
        if (error) {
            console.error("Fetch Deposits Error:", error);
            return res.status(500).json({ error: 'Failed to fetch deposits' });
        }
        if (!deposits || deposits.length === 0) {
            return res.status(404).json({ error: 'No records found for the selected period' });
        }
        // Meta for PDF
        const title = scope === 'company' ? 'Organization Summary Report' : 'Individual Activity Report';
        const meta = {
            title: `${title} (${type ? type.toUpperCase() : 'ALL'})`,
            scope: scope === 'company' ? 'Simotwet Coffee Society - Full Registry' : `Member: ${((_a = deposits[0].users) === null || _a === void 0 ? void 0 : _a.full_name) || 'N/A'}`,
            ref: (0, uuid_1.v4)(),
            user_id: req.user.id
        };
        const pdfUrl = yield (0, pdf_1.generateAggregatePdfReport)(deposits, meta);
        // Record in reports table
        yield db_1.supabase.from('reports').insert([{
                user_id: req.user.id,
                type: type || 'all',
                document_url: pdfUrl
            }]);
        return res.json({ message: 'Report generated successfully', url: pdfUrl });
    }
    catch (error) {
        console.error("Report Generation Error:", error);
        return res.status(500).json({ error: 'Server error during report generation' });
    }
}));
// Trigger SMS Delivery for Aggregate Reports
router.post('/send-sms-report', middleware_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.body; // 'daily', 'weekly', 'monthly', 'annual'
        let query = db_1.supabase.from('coffee_deposits').select('weight_kg').eq('user_id', req.user.id);
        if (type === 'daily') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.gte('created_at', today.toISOString());
        }
        else if (type === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            query = query.gte('created_at', lastWeek.toISOString());
        }
        else if (type === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            query = query.gte('created_at', lastMonth.toISOString());
        }
        else if (type === 'annual') {
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            query = query.gte('created_at', lastYear.toISOString());
        }
        const { data: deposits, error } = yield query;
        if (error)
            return res.status(500).json({ error: 'Failed to fetch deposit details' });
        let totalWeight = 0;
        deposits.forEach((dep) => { totalWeight += Number(dep.weight_kg); });
        const timeLabel = type ? String(type).charAt(0).toUpperCase() + String(type).slice(1) : 'Total';
        const msg = `SIMOTWET COFFEE SOCIETY: Your ${timeLabel} deposit summary is: ${totalWeight.toFixed(2)} Kg. Download full PDF via your dashboard.`;
        try {
            yield (0, sms_1.sendSMS)(req.user.phone_number, msg);
            yield db_1.supabase.from('sms_logs').insert([{
                    user_id: req.user.id,
                    phone_number: req.user.phone_number,
                    message: `Report delivery: ${timeLabel}`,
                    status: 'sent'
                }]);
        }
        catch (smsErr) {
            console.error("SMS Report Send Error:", smsErr);
            yield db_1.supabase.from('sms_logs').insert([{
                    user_id: req.user.id,
                    phone_number: req.user.phone_number,
                    message: `Report delivery: ${timeLabel}`,
                    status: 'failed'
                }]);
        }
        return res.json({ message: 'SMS Report requested and processed.' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
}));
exports.default = router;
