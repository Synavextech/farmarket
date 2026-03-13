import { Router, Request, Response } from 'express';
import { supabase, logActivity } from './db';
import { requireAuth, requireAdmin } from './middleware';
import { generatePdfReceipt } from './pdf';
import { sendSMS } from './sms';

const router = Router();

// Create Deposit (Admin/Operator Only)
router.post('/', requireAuth, requireAdmin, async (req: any, res: Response): Promise<any> => {
    try {
        const { user_id, weight_kg, quality_grade, notes } = req.body;
        const operator_id = req.user.id;

        if (!user_id || !weight_kg) {
            return res.status(400).json({ error: 'User ID and Weight are required' });
        }

        // Fetch User Info
        const { data: member, error: memberErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', user_id)
            .single();

        if (memberErr || !member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // 1. Insert Initial Deposit (status pending, no receipt URL yet)
        const { data: deposit, error: insertErr } = await supabase
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
            pdfUrl = await generatePdfReceipt({
                ...deposit,
                user_name: member.full_name,
                phone_number: member.phone_number,
                national_id: member.national_id,
                operator_name: req.user.name || 'Admin', // If the admin jwt has it, else generic
            });
            
            // Update the deposit with receipt URL
            await supabase.from('coffee_deposits').update({ receipt_url: pdfUrl }).eq('id', deposit.id);
            deposit.receipt_url = pdfUrl;
        } catch (pdfErr) {
            console.error("PDF Gen Error:", pdfErr);
            // Non-fatal, admin can retry generating pdf later
        }

        // 3. Send SMS notification
        let smsStatus = 'failed';
        try {
            const msg = `SIMOTWET COFFEE SOCIETY: Hello ${member.full_name}, ${weight_kg} Kg of coffee has been deposited to your account. Receipt available in your dashboard securely.`;
            const smsResp = await sendSMS(member.phone_number, msg);
            smsStatus = 'sent';
            // Determine AT's status per recipient if needed, but 'sent' generally means queued to AT
        } catch (smsErr) {
            console.error("SMS Sending Error:", smsErr);
            smsStatus = 'failed';
        }

        // Log SMS explicitly
        await supabase.from('sms_logs').insert([{
            user_id: member.id,
            phone_number: member.phone_number,
            message: `Deposit ${weight_kg}kg SMS`,
            status: smsStatus
        }]);

        // Log administrative action
        await logActivity(operator_id, 'CREATE_DEPOSIT', { deposit_id: deposit.id, user_id, weight_kg });

        return res.status(201).json({
            message: 'Deposit logged successfully',
            deposit,
            sms_status: smsStatus
        });
    } catch (error) {
        console.error("Deposit creation flow error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// List Deposits (Members see own, Admins see all)
router.get('/', requireAuth, async (req: any, res: Response): Promise<any> => {
    try {
        const isAdmin = ['admin', 'operator'].includes(req.user.role);
        
        let query = supabase.from('coffee_deposits').select(`
            *,
            users:user_id(full_name, phone_number)
        `).order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('user_id', req.user.id);
        }

        const { data, error } = await query;

        if (error) return res.status(500).json({ error: 'Failed to fetch deposits' });
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
