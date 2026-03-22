import { GoCardlessService } from './gocardless.service';
import { getDB } from '../db/index';
import { transactions, bankConnections } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class SyncService {
    private gcService: GoCardlessService;

    constructor(gcService: GoCardlessService) {
        this.gcService = gcService;
    }

    async syncConnection(connectionId: string, dateFrom?: string, dateTo?: string) {
        const db = getDB();

        // 1. Get connection details from DB
        const connection = db.select().from(bankConnections).where(eq(bankConnections.id, connectionId)).get();

        if (!connection) {
            throw new Error('Connection not found');
        }

        // 2. Refresh requisition status
        const requisition = await this.gcService.getRequisition(connectionId);

        if (requisition.status !== 'LN') { // LN = Linked
            throw new Error(`Requisition status: ${requisition.status}`);
        }

        const accountIds = requisition.accounts;
        let totalSynced = 0;

        for (const accountId of accountIds) {
            // 3. Fetch transactions with optional date filter
            const txData = await this.gcService.getTransactions(accountId, dateFrom, dateTo);
            const booked = txData.transactions.booked;

            // 4. Normalize and Save
            for (const tx of booked) {
                const amount = parseFloat(tx.transactionAmount.amount);
                const date = new Date(tx.bookingDate || tx.valueDate);
                const description = tx.remittanceInformationUnstructured || 'No description';
                const transactionId = tx.transactionId || randomUUID();

                // Check for duplicate
                const existing = db.select().from(transactions).where(eq(transactions.id, transactionId)).get();

                if (!existing) {
                    db.insert(transactions).values({
                        id: transactionId,
                        bankConnectionId: connectionId,
                        amount: amount,
                        currency: tx.transactionAmount.currency,
                        description: description,
                        date: date,
                        status: 'pending',
                        merchant: tx.creditorName || tx.debtorName,
                        metadata: JSON.stringify(tx),
                        accountId: accountId,
                    }).run();
                    totalSynced++;
                }
            }
        }

        return { synced: totalSynced };
    }
}
