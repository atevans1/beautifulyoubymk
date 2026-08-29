# Donations and partnerships safety requirements

- Use a modular payment adapter; never place card details or provider secrets in this repository.
- Treat provider webhooks as untrusted until signature verification succeeds.
- Store only the minimum donor and transaction metadata needed for receipts and reporting.
- Restrict donor and donation records to finance-authorised administrators.
- Keep partnership enquiries private until an administrator approves publication.
- Do not present donation totals publicly until they come from verified records.
