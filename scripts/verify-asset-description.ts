import assert from 'node:assert/strict';
import {truncateMetaDescription, generateAssetMetaDescription} from '../src/lib/assetContent';
import {ASSETS} from '../src/lib/assets';
const euro = ASSETS.find(a => a.id === 'eurusd')!;
assert.equal(generateAssetMetaDescription(euro), 'Practise EUR/USD with $100K virtual cash. EUR/USD expresses the number of US dollars per euro.');
assert.equal(truncateMetaDescription('A rate moves from 1.10 to 1.12. A separate longer sentence continues here.', 25), 'A rate moves from 1.10 to 1.12.');
assert.equal(truncateMetaDescription('A decimal 1.12 within a deliberately long first sentence without a shorter alternative.', 20), 'A decimal 1.12 within a deliberately long first sentence without a shorter alternative.');
assert.equal(truncateMetaDescription('No terminal punctuation in this long description', 12), 'No terminal punctuation in this long description');
console.log('EUR/USD description, decimal boundaries and complete long sentences pass.');
