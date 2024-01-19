import { beforeAll, beforeEach, expect, describe, it } from 'vitest'
import { schnorr } from '@noble/curves/secp256k1';
import { hex } from '@scure/base';

describe('Deposit tests', () => {
  beforeAll(async () => {
  })

  beforeEach(async () => {
  })

  it.concurrent('Check key generation', async () => {
    const priv = schnorr.utils.randomPrivateKey();
    const pub = schnorr.getPublicKey(priv);
    const msg = new TextEncoder().encode('hello');
    const sig = schnorr.sign(msg, priv);
    const isValid = schnorr.verify(sig, msg, pub);
    expect(pub.length).equals(32)
    expect(isValid).equals(true)
  })

  it.concurrent('Alice reclaim path', async () => {
    let privateKey: '14264384228152409048980676764470696379440826802199624906017502477535750651216'
    let schnorrPub = schnorr.getPublicKey(hex.decode(privateKey));
    console.log('schnorrPub:' + schnorrPub)

    const priv = schnorr.utils.randomPrivateKey();
    const pub = schnorr.getPublicKey(priv);
    console.log('pub:' + hex.encode(pub))
    const msg = new TextEncoder().encode('hello');
    const sig = schnorr.sign(msg, priv);
    const isValid = schnorr.verify(sig, msg, pub);
    expect(pub.length).equals(32)
    expect(isValid).equals(true)
  })

})

