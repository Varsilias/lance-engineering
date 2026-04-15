import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000/api/v1';

const randomName = () =>
  `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

async function createUser(name: string) {
  const res = await axios.post(`${BASE_URL}/users`, { name });
  return res.data.data;
}

async function fundWallet(user_id: string, amount: number) {
  const res = await axios.post(`${BASE_URL}/wallet/deposit`, {
    user_id,
    amount,
    reference: crypto.randomUUID(),
  });
  return res.data.data;
}

async function transfer(
  from_wallet_id: string,
  to_wallet_id: string,
  amount: number,
  reference?: string,
) {
  return axios.post(`${BASE_URL}/wallet/transfer`, {
    from_account_id: from_wallet_id,
    to_account_id: to_wallet_id,
    amount,
    reference: reference ?? crypto.randomUUID(),
  });
}

async function getBalance(user_id: string) {
  const res = await axios.get(`${BASE_URL}/wallet/${user_id}/balance`);

  const raw = res.data?.data?.balance_naira;

  if (raw === undefined || raw === null) {
    throw new Error('Balance response malformed');
  }

  return Number(raw);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Starting stress test...');

  // create users
  const userA = await createUser(randomName());
  const userB = await createUser(randomName());

  console.log('Users created');

  // fund user A
  const startingAmount = 10000; // naira
  await fundWallet(userA.public_id ?? userA.id, startingAmount);

  console.log('Wallet funded');

  const transferAmount = 100; // naira
  const concurrency = 50;

  console.log(`Running ${concurrency} concurrent transfers...`);

  let success = 0;
  let insufficient = 0;
  let otherErrors = 0;

  const tasks = Array.from({ length: concurrency }).map(async (_, i) => {
    try {
      // simulate real-world request timing
      await sleep(Math.random() * 40);

      await transfer(userA.wallet.id, userB.wallet.id, transferAmount);

      success++;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'unknown_error';

      if (msg.toLowerCase().includes('insufficient')) {
        insufficient++;
      } else {
        otherErrors++;
        console.error(`Unexpected error [${i}]:`, msg);
      }
    }
  });

  await Promise.all(tasks);

  console.log(
    `Transfers done → success: ${success}, insufficient: ${insufficient}, otherErrors: ${otherErrors}`,
  );

  // compute balances BEFORE duplicate test (important)
  const balanceA = await getBalance(userA.public_id ?? userA.id);
  const balanceB = await getBalance(userB.public_id ?? userB.id);

  console.log('Final balances:');
  console.log('User A:', balanceA);
  console.log('User B:', balanceB);

  // expected calculation in NAIRA
  const expectedSpent = success * transferAmount;
  const expectedBalanceA = startingAmount - expectedSpent;

  console.log('Expected A balance:', expectedBalanceA);

  if (balanceA < 0) {
    console.error('Negative balance detected. This is a failure.');
  }

  if (balanceA !== expectedBalanceA) {
    console.error(
      'Balance mismatch detected. Expected vs Actual:',
      expectedBalanceA,
      balanceA,
    );
  }

  // failure scenario: duplicate reference test (does not affect balance assertions)
  console.log('Testing idempotency (duplicate reference)...');

  const duplicateRef = crypto.randomUUID();

  const t1 = transfer(
    userA.wallet.id,
    userB.wallet.id,
    transferAmount,
    duplicateRef,
  );

  const t2 = transfer(
    userA.wallet.id,
    userB.wallet.id,
    transferAmount,
    duplicateRef,
  );

  const dupResults = await Promise.allSettled([t1, t2]);

  const formatted = dupResults.map((r) => {
    if (r.status === 'fulfilled') {
      const tx = r.value.data?.data;

      return `SUCCESS: tx_id=${tx?.id ?? 'unknown'} ref=${tx?.reference ?? 'unknown'}`;
    }

    const msg =
      r.reason?.response?.data?.message || r.reason?.message || 'unknown_error';

    return `ERROR: ${msg}`;
  });

  console.log('Duplicate reference results:');
  formatted.forEach((line) => console.log('  -', line));

  console.log('Done.');
}

run().catch((err) => {
  console.error('Test failed:', err.message);
});
