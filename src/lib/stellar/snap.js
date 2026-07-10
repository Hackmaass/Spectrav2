/**
 * MetaMask Snap Integration for Stellar
 * Uses the official community stellar-snap to derive keys and sign txs inside MetaMask.
 */
export const SNAP_ID = 'npm:stellar-snap';

export async function isStellarSnapInstalled() {
  if (!window.ethereum) return false;
  try {
    const snaps = await window.ethereum.request({ method: 'wallet_getSnaps' });
    return Object.keys(snaps).includes(SNAP_ID);
  } catch (e) {
    return false;
  }
}

export async function connectStellarSnap() {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [SNAP_ID]: {}
    }
  });

  return await getStellarPublicKey();
}

export async function getStellarPublicKey() {
  if (!window.ethereum) return null;
  try {
    const response = await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ID,
        request: { method: 'getAddress' }
      }
    });
    return response.address;
  } catch (e) {
    console.error("Failed to get Stellar public key from snap:", e);
    return null;
  }
}

export async function signStellarTransaction(xdr, testnet = true) {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  
  const response = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: SNAP_ID,
      request: {
        method: 'signTransaction',
        params: {
          transaction: xdr,
          networkPassphrase: testnet 
            ? "Test SDF Network ; September 2015" 
            : "Public Global Stellar Network ; September 2015"
        }
      }
    }
  });

  if (response.error) {
    throw new Error(response.error);
  }

  return response.transaction; // Signed XDR string
}
