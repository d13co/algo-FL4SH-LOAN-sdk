# algo-fl4sh-loan-sdk

[]() client for javascript.

## What it is / How it works / Why would I use it / etc

Read the [FL4SH LOAN documentation here]().

## Installation

```
npm i algo-fl4sh-loan-sdk
```

or

```
yarn algo-fl4sh-loan-sdk
```

## Example use

See also: examples/ for a standalone example.

```
import algosdk from 'algosdk';
import { makeLoanTxn, signLoanTxn } from 'algo-fl4sh-lsig-sdk';

const algod = new algosdk.Algodv2("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://localhost", "4001");

const mnem = 'essay glory sponsor now detect bitter first arrive elder noble immense direct shock forest whale relief puppy coast initial blood salute total cube about expect';

const { addr, sk } = algosdk.mnemonicToSecretKey(mnem);

const suggestedParams = await algod.getTransactionParams().do();

// unsignedLoanTxn: the loan from the logic sig to "addr"
// unsignedRepayTxn: an example repayment txn back to the logic sig
// repayAmount: use if you want to create your own repayment transaction
const [unsignedLoanTxn, unsignedRepayTxn, repayAmount] = await makeLoanTxn({
  algosdk,
  algod, 
  fees: 10_000,
  receiver: addr,
  amount: 1_000_000,
});

// group the transactions
// loan txn MUST be first
// repayment txn MUST be last
// repayment can be from any address
// repayment MUST be an outer payment - CAN NOT be from an inner transaction in an app call
algosdk.assignGroupID([unsignedLoanTxn, /* your other transactions go here */ unsignedRepayTxn]);

// sign and submit
const signed = [
  signLoanTxn(unsignedLoanTxn, algosdk).blob,
  algosdk.signTransaction(unsignedRepayTxn, sk).blob,
];

try {
  const { txId } = await algod.sendRawTransaction(signed).do();
  console.log('OK', txId);
} catch(e) {
  console.error(e);
}
```

## Exported functions

Note: All functions expect `algosdk` to be passed as a parameter.

### async makeLoanTxn

makeLoanTxn returns the first and last transactions (unsigned) to be placed in the transaction group.

Call with parameters: 

```
const [unsignedLoanTxn, unsignedRepayTxn, repayAmount] = await makeLoanTxn({
  algosdk,
  receiver,
  amount,
  fees,
  suggestedParams,
  algod,
});
```

Object parameter values: 

- algosdk: required. pass in the js-algorand-sdk you are using on your client.
- receiver: required. address of loan recipient.
- amount: required. can be 0. amount to withdraw.
- fees: optional. Flat fee to set in the loan transaction. Will default to suggestedParams or query suggested parameters from algod.
- suggestedParams: optional[2]. Suggested parameters to use. if fees is also provided, `flatFee` will be set to `true` and `fee` will be set to the fees value
- algod: optional[2]. Algod v2 client to query suggested parameters.

\* optional[2]: one of algod or suggestedParams is required

Return values: Array of:

- Unsigned loan transaction. Goes first in the group.
- Unsigned loan repayment transaction. Goes last in the group.
- Repayment amount. Use this in case you want to repay the loan from a different account.

### signLoanTxn

Signs a loan txn with the logic sig.

```
const signed = signLoanTxn(unsignedLoanTxn, algosdk);
```

Arguments:

- unsignedLoanTxn: unsigned loan transaction as generated from `makeLoanTxn`
- algosdk: your algosdk

Returns:

Signed transaction, containing: `{ txID, blob }`

### getAddress

Returns the fl4sh loan logic sig address: `FL4SHLOANLERAK6AFTBSBIL2WIWCRUFY7XWQK57H3EXM6GMMGMPT7C3UKI`

```
const address = getAddress(algosdk);
```

Arguments: 

- algosdk

### getLsig

Returns a LogicSigAccount (algosdk class)

```
const lsigAccount = getLsig(algosdk);
```

