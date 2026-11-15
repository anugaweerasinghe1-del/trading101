import assert from 'node:assert/strict';
import {truncateMetaDescription, generateAssetMetaDescription} from '../src/lib/assetContent';
import {ASSETS} from '../src/lib/assets';
const euro = ASSETS.find(a => a.id === 'eurusd')!;
assert.equal(generateAssetMetaDescription(euro), 'Practise EUR/USD with $100K virtual cash. EUR/USD expresses the number of US dollars per euro.');
assert.equal(truncateMetaDescription('A rate moves from 1.10 to 1.12. A separate longer sentence continues here.', 25), 'A rate moves from 1.10 to 1.12.');
assert.equal(truncateMetaDescription('A decimal 1.12 within a deliberately long first sentence without a shorter alternative.', 20), 'A decimal 1.12 within a deliberately long first sentence without a shorter alternative.');
assert.equal(truncateMetaDescription('No terminal punctuation in this long description', 12), 'No terminal punctuation in this long description');
console.log('EUR/USD description, decimal boundaries and complete long sentences pass.');

const crm = ASSETS.find(a => a.id === 'crm')!;
const company = generateAssetMetaDescription(crm);
assert.match(company, /Salesforce Inc\. \(CRM\) provides cloud software for customer relationship management, including sales, marketing and customer service\.$/);
assert.notEqual(company, 'Practise CRM with $100K virtual cash. Salesforce Inc.');
assert.equal(truncateMetaDescription('Example Inc. provides cloud software. Another complete sentence.', 20), 'Example Inc. provides cloud software.');
assert.equal(truncateMetaDescription('Example Co. works in the U.S. market. Another complete sentence.', 20), 'Example Co. works in the U.S. market.');
assert.equal(truncateMetaDescription('Dr. Example describes the input. Another sentence.', 12), 'Dr. Example describes the input.');
for (const asset of ASSETS) {
  const description = generateAssetMetaDescription(asset);
  assert.ok(description.length > 20, asset.id);
  assert.doesNotMatch(description, /\b(?:Inc|Corp|Co|Ltd)\.$/, asset.id + ': must not end at a corporate abbreviation');
  assert.doesNotMatch(description, /\.\.\.$/, asset.id + ': no midword ellipsis');
}
console.log('PASS all170 asset descriptions plus corporate, acronym, decimal and long-fact boundary regressions');
