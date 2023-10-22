import algosdk from 'algosdk';
import { getAddress, makeLoanTxn, getLsig, signLoanTxn, } from './index.js';
import { expect } from 'expect';

const lsigAddr = 'FL4SHLOANLERAK6AFTBSBIL2WIWCRUFY7XWQK57H3EXM6GMMGMPT7C3UKI';

const userAddr = 'MR3CVALT5BEFD3QHAEV3JVDFV3ACWIBTTKTCK3WGZK73OOHAXOVP53J6RA';

const suggestedParams = {"flatFee":false,"fee":0,"firstRound":30127,"lastRound":31127,"genesisID":"sandnet-v1","genesisHash":"Zxe6BJA8Z9SjTEkpforOfYvCxhh/kArlJhj/OViY7oE=","minFee":1000};

describe('algo-fl4sh-lsig-sdk', () => {
  it('getAddress should return the correct address', () => {
    expect(getAddress(algosdk)).toBe(lsigAddr);
  });

  it('makeLoanTxn should return two transactions and the right repayment amount', async () => {
    const amount = 1_000_000;
    const fees = 10_000;
    const [loanTxn, repayTxn, repayAmt] = await makeLoanTxn({
      algosdk,
      receiver: userAddr,
      amount,
      fees,
      suggestedParams,
    });
    const expectedRepay = Math.floor(1.1*(amount + fees));

    expect(loanTxn).toBeInstanceOf(algosdk.Transaction);
    expect(repayTxn).toBeInstanceOf(algosdk.Transaction);

    expect(algosdk.encodeAddress(loanTxn.from.publicKey)).toBe(lsigAddr);
    expect(algosdk.encodeAddress(loanTxn.to.publicKey)).toBe(userAddr);
    expect(loanTxn.amount).toBe(amount);
    expect(loanTxn.fee).toBe(fees);

    expect(repayAmt).toBe(expectedRepay);
  });

  it('getLsig should return the lsig', () => {
    const lsig = getLsig(algosdk);
    expect(lsig).toBeInstanceOf(algosdk.LogicSigAccount);
  });

  it('signLoanTxn should sign loan txn', async () => {
    const amount = 1_000_000;
    const fees = 10_000;
    const [loanTxn] = await makeLoanTxn({
      algosdk,
      receiver: userAddr,
      amount,
      fees,
      suggestedParams,
    });
    const signed = signLoanTxn(loanTxn, algosdk);
    expect(signed.txID.length).toBe(52);
    expect(signed.blob).toBeInstanceOf(Uint8Array);
  });
});
