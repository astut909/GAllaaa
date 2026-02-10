
export enum TransactionType {
  CREDIT = 'credit', // Money given (customer owes you)
  DEBIT = 'debit'    // Money received (you received from customer)
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: TransactionType;
  date: string;
  note: string;
}

export interface Customer {
  id: string;
  name: string;
  balance: number; // Positive means they owe you (Credit), negative means you owe them (Debit)
  lastTransactionDate: string;
}

export interface VoiceExtractionResult {
  customerName: string;
  amount: number;
  type: TransactionType;
  note: string;
}
