'use strict';

const { Op } = require('sequelize');
const softOneQueue = require('../models/softone_queue.js');
const { sendOrderToSoftOne } = require('./orderToSoftone.js');

const intervalInMinutes = Number(process.env.ORDERRESENDINTERVAL ?? 30);
const maxAttempts = Number(process.env.ORDERRESENDMAXATTEMPTS ?? 3);

let isProcessing = false;   // Αποτρέπει ταυτόχρονη εκτέλεση αν μια εκτέλεση αργεί να τελειώσει

/** Ελέγχει για pending παραγγελίες στη βάση και τις ξαναστέλνει στο SoftOne */
async function processQueue() {
    if (isProcessing) {
        console.warn('[OrderQueue] Παράλειψη εκτέλεσης: η προηγούμενη εκτέλεση δεν έχει ολοκληρωθεί ακόμα.');
        return;
    }
    isProcessing = true;
    let pendingEntries;
    try {
        pendingEntries = await softOneQueue.findAll({
            where: {
                status: 'pending',
                attempts: { [Op.lt]: maxAttempts }
            }
        });
    } catch (err) {
        console.error('[OrderQueue] Σφάλμα κατά την ανάκτηση pending εγγραφών:', err);
        isProcessing = false;
        return;
    }

    if (!pendingEntries.length) {
        // console.debug('[OrderQueue] Δεν υπάρχουν pending παραγγελίες προς επεξεργασία.');
        isProcessing = false;
        return;
    }

    console.log(`[OrderQueue] Βρέθηκαν ${pendingEntries.length} pending παραγγελίες. Αποστολή στο SoftOne...`);

    // Η εκτέλεση γίνεται σειριακά (όχι ταυτόχρονα). 
    for (const entry of pendingEntries) {
        const newAttempts = entry.attempts + 1;
        try {
            const softoneResponse = await sendOrderToSoftOne(entry.payload, true);   // Θέλουμε await
            const newStatus = softoneResponse.success
                ? 'completed'
                : newAttempts >= maxAttempts ? 'failed' : 'pending';

            await entry.update({ attempts: newAttempts, status: newStatus, response: softoneResponse });

            if (softoneResponse.success) {
                console.log(`\x1b[36m[OrderQueue] Η παραγγελία ${entry.orderId} απεστάλη επιτυχώς. Αριθμοί παραστατικών: ${softoneResponse.data?.join(', ')}\x1b[0m`);
            } else if (newStatus === 'failed') {
                console.error(`[OrderQueue] Η παραγγελία ${entry.orderId} απέτυχε οριστικά μετά από ${newAttempts} προσπάθειες.`);
            } else {
                console.warn(`[OrderQueue] Η παραγγελία ${entry.orderId} απέτυχε (προσπάθεια ${newAttempts}/${maxAttempts}). Θα δοκιμαστεί ξανά.`);
            }
        } catch (err) {
            console.error(`[OrderQueue] Ο SoftOne server είναι μη διαθέσιμος. Διακοπή queue:`, err.message);
            break;      // Μη στείλεις ούτε τις υπόλοιπες παραγγελίες αν ο server είναι down
        }
    }
    isProcessing = false;
}

setInterval(processQueue, intervalInMinutes * 60 * 1000);

module.exports = { processQueue };

