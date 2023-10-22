import algosdk from 'algosdk';
import { makeLoanTxn, signLoanTxn, getAddress } from '../index.js';

/*
 * This example shows the simplest use case, making the fl4shloan logicsig do a 0-amount, 1000-fee transaction.
 * We repay 1100 for the fee 
 *
 * Make sure to fund your account (SKHZ5MOLIECMR6OZ24FYP26LCTCMLGBR36WMIGH22NRFUPKSXZJZGZO5QU in the example mnemonic) and the logic sig account (printed when you run this)
 */

const token = process.env.TOKEN ?? "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const host = process.env.HOST ?? "http://localhost";
const port = process.env.PORT ?? "4001";
const mnem = process.env.MNEM ?? 'essay glory sponsor now detect bitter first arrive elder noble immense direct shock forest whale relief puppy coast initial blood salute total cube about expect';

const algod = new algosdk.Algodv2(token, host, port);

const { addr, sk } = algosdk.mnemonicToSecretKey(mnem);

const suggestedParams = await algod.getTransactionParams().do();

// unsignedLoanTxn: the loan from the logic sig to "addr"
// unsignedRepayTxn: an example repayment txn back to the logic sig
// repayAmount: use if you want to create your own repayment transaction
const [unsignedLoanTxn, unsignedRepayTxn, repayAmount] = await makeLoanTxn({
  algosdk,
  algod, 
  fees: 1_000,
  receiver: addr,
  amount: 0,
});

console.log({ fl4shLoanLogicSigAccount: getAddress(algosdk) });
console.log("Repaymount should be 1.1 * (0 + 1000) = 1100");
console.log({ repayAmount });

// group the transactions
// loan txn MUST be first
// repayment txn MUST be last
// repayment can be from any address
// repayment MUST be an outer payment - CAN NOT be from an inner transaction in an app call
algosdk.assignGroupID([unsignedLoanTxn, /* your other txns can go here */ unsignedRepayTxn]);

// sign and submit
const signed = [
  signLoanTxn(unsignedLoanTxn, algosdk).blob,
  algosdk.signTransaction(unsignedRepayTxn, sk).blob,
];

try {
  const { txId } = await algod.sendRawTransaction(signed).do();
  console.log('OK', txId);
  console.log(`https://app.dappflow.org/explorer/transaction/${txId}`);
} catch(e) {
  const m = /overspend \(account ([A-Z2-7]+)/.exec(e.message);
  console.error(e);
  if (m) {
    const addr = m[1];
    const label = addr === getAddress(algosdk) ? 'The fl4shloan logicsig' : "Your";
    console.error(`Error: ${label} account ${m[1]} needs to be funded first!`);
    console.error(`In sandbox you can use "goal clerk send -f  FROM -t TO -a AMOUNT"`);
  }
}
