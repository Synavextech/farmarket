import { Router, Response } from 'express';
import { supabase } from './db';
import { requireAuth } from './middleware';
import { generateAggregatePdfReport } from './pdf';
import { v4 as uuidv4 } from 'uuid';
import { sendSMS } from './sms';

const router = Router();

// Generate Aggregate Report PDF (Individual or Company-wide)
router.get('/', requireAuth, async (req: any, res: Response): Promise<any> => {
    try {
        const { type, scope, user_id } = req.query; // type: 'daily', 'weekly', 'monthly', 'annual', 'all'; scope: 'individual', 'company'
        const isAdmin = ['admin', 'operator'].includes(req.user.role);
        
        let targetUserId = req.user.id;
        if (isAdmin && scope === 'individual' && user_id) {
            targetUserId = user_id;
        }

        let query = supabase
            .from('coffee_deposits')
            .select(`
                *,
                users:user_id(full_name, phone_number, national_id)
            `)
            .order('created_at', { ascending: true });
        
        // Scope Handling
        if (scope === 'company' && isAdmin) {
            // No user_id filter for company-wide admin reports
        } else {
            query = query.eq('user_id', targetUserId);
        }
        
        // Time Filter Handling
        const now = new Date();
        if (type === 'daily') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.gte('created_at', today.toISOString());
        } else if (type === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            query = query.gte('created_at', lastWeek.toISOString());
        } else if (type === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            query = query.gte('created_at', lastMonth.toISOString());
        } else if (type === 'annual') {
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            query = query.gte('created_at', lastYear.toISOString());
        }

        const { data: deposits, error } = await query;

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
            scope: scope === 'company' ? 'Simotwet Coffee Society - Full Registry' : `Member: ${deposits[0].users?.full_name || 'N/A'}`,
            ref: uuidv4(),
            user_id: req.user.id
        };

        const pdfUrl = await generateAggregatePdfReport(deposits, meta);

        // Record in reports table
        await supabase.from('reports').insert([{
            user_id: req.user.id,
            type: (type as any) || 'all',
            document_url: pdfUrl
        }]);

        return res.json({ message: 'Report generated successfully', url: pdfUrl });

    } catch (error) {
        console.error("Report Generation Error:", error);
        return res.status(500).json({ error: 'Server error during report generation' });
    }
});

// Trigger SMS Delivery for Aggregate Reports
router.post('/send-sms-report', requireAuth, async (req: any, res: Response): Promise<any> => {
    try {
        const { type } = req.body; // 'daily', 'weekly', 'monthly', 'annual'
        
        let query = supabase.from('coffee_deposits').select('weight_kg').eq('user_id', req.user.id);
        
        if (type === 'daily') {
            const today = new Date();
            today.setHours(0,0,0,0);
            query = query.gte('created_at', today.toISOString());
        } else if (type === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            query = query.gte('created_at', lastWeek.toISOString());
        } else if (type === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            query = query.gte('created_at', lastMonth.toISOString());
        } else if (type === 'annual') {
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            query = query.gte('created_at', lastYear.toISOString());
        }

        const { data: deposits, error } = await query;

        if (error) return res.status(500).json({ error: 'Failed to fetch deposit details' });

        let totalWeight = 0;
        deposits.forEach((dep: any) => { totalWeight += Number(dep.weight_kg); });

        const timeLabel = type ? String(type).charAt(0).toUpperCase() + String(type).slice(1) : 'Total';
        const msg = `SIMOTWET COFFEE SOCIETY: Your ${timeLabel} deposit summary is: ${totalWeight.toFixed(2)} Kg. Download full PDF via your dashboard.`;

        try {
            await sendSMS(req.user.phone_number, msg);
            await supabase.from('sms_logs').insert([{
                user_id: req.user.id,
                phone_number: req.user.phone_number,
                message: `Report delivery: ${timeLabel}`,
                status: 'sent'
            }]);
        } catch (smsErr) {
            console.error("SMS Report Send Error:", smsErr);
            await supabase.from('sms_logs').insert([{
                user_id: req.user.id,
                phone_number: req.user.phone_number,
                message: `Report delivery: ${timeLabel}`,
                status: 'failed'
            }]);
        }

        return res.json({ message: 'SMS Report requested and processed.' });

    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
