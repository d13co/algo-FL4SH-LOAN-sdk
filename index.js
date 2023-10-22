const b64 = 'BSACAQAmASAczojMhGtXLBlyJedxevyVR2YWIngcCgr2RdMRVDZCDDEQIhIxCTIDEhAxIDIDEhAxFiMSEDIEIgk4ECISMgQiCTgHMwAAEhAyBCIJOAiB4JFDMQExCAgdI4HAhD0fSEhMFEQPEBAzAAcoEjMAACgSEIAI0T26AD/IqACAABMQEUM=';

function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function getLsig(algosdk) {
  if (!algosdk) {
    throw new Error("Error: algosdk parameter missing");
  }
  return new algosdk.LogicSigAccount(new Uint8Array(base64ToArrayBuffer(b64)));
}

export function signLoanTxn(loanTxn, algosdk) {
  if (!algosdk) {
    throw new Error("Error: algosdk parameter missing");
  }
  return algosdk.signLogicSigTransaction(loanTxn, getLsig(algosdk));
}

export function getAddress(algosdk) {
  if (!algosdk) {
    throw new Error("Error: algosdk parameter missing");
  }
  return getLsig(algosdk).address();
}

export async function makeLoanTxn({
  algosdk,
  receiver,
  amount,
  fees,
  algod,
  suggestedParams,
}) {
  if (!algosdk) {
    throw new Error("Error: algosdk parameter missing");
  }
  if (!algod && !suggestedParams) {
    throw new Error(`Error: Provide either an algod client or suggestedParams`);
  }
  if (!suggestedParams) {
    suggestedParams = await algod.getTransactionParams().do();
  }
  if (typeof fees !== 'undefined') {
    suggestedParams.flatFee = true;
    suggestedParams.fee = fees;
  }
  try {
    algosdk.decodeAddress(receiver);
  } catch(e) {
    throw new Error(`Invalid receiver: ${receiver}`);
  }
  const { fee: explicitFees } = suggestedParams;
  const finalFees = Math.max(explicitFees, 1000);
  const finalAmount = finalFees + amount;
  const repaymentAmount = Math.floor(1.1 * finalAmount);

  const lsigA = getLsig(algosdk);
  const loanTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: lsigA.address(),
    to: receiver,
    amount,
    suggestedParams,
  });

  const flatFeeParams = {
    ...suggestedParams,
    flatFee: true,
    fee: 1000,
  };
  const loanRepaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: receiver,
    to: lsigA.address(),
    amount: repaymentAmount,
    suggestedParams: flatFeeParams,
  });
  return [loanTxn, loanRepaymentTxn, repaymentAmount];
}
