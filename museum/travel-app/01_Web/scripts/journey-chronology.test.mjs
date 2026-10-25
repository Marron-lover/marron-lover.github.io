import test from 'node:test';
import assert from 'node:assert/strict';
import {buildJourneyEntries, groupJourneyEntriesByYear} from '../src/data/journeyChronology.ts';

const egypt={id:'egypt',nameEn:'Egypt',nameZh:'埃及',cityIds:[],records:[],visitedDateRange:'2025-07',visitStatus:'visited'};

test('country-only visit appears in chronology and Year Cards at its actual month precision',()=>{
  const entries=buildJourneyEntries([egypt],[],[]);
  assert.deepEqual(entries,[{kind:'country',id:'country-visit:egypt',countryId:'egypt',date:'2025-07',endDate:'2025-07'}]);
  const groups=groupJourneyEntriesByYear(entries);
  assert.equal(groups[0].year,2025);
  assert.equal(groups[0].countries[0].startDate,'2025-07');
  assert.equal(groups[0].countries[0].endDate,'2025-07');
  assert.deepEqual(groups[0].countries[0].cityIds,[]);
  assert.equal(groups[0].countries[0].countryVisits.length,1);
  assert.deepEqual(egypt.records,[]);
});

test('city visit retains dates and creates one country group without a duplicate country-only entry',()=>{
  const country={...egypt,cityIds:['cairo'],records:[{id:'visit'}]};
  const city={id:'cairo',countryId:'egypt',records:[{id:'visit',start_date:'2025-07',end_date:'2025-08'}]};
  const day={id:'visit',countryId:'egypt',cityId:'cairo',date:'2025-07'};
  const entries=buildJourneyEntries([country],[city],[day]);
  assert.equal(entries.length,1);
  assert.equal(entries[0].kind,'city');
  const group=groupJourneyEntriesByYear(entries)[0].countries[0];
  assert.deepEqual(group.cityIds,['cairo']);
  assert.equal(group.endDate,'2025-08');
  assert.deepEqual(group.countryVisits,[]);
});

test('undated facts and wishlist entries retain their optional dates without inventing chronology',()=>{
  assert.deepEqual(buildJourneyEntries([{...egypt,visitedDateRange:'Date unknown'},{...egypt,id:'wishlist',visitStatus:'wishlist'}],[],[]),[]);
});

test('mixed country and city entries group by their actual years and sort newest first',()=>{
  const france={...egypt,id:'france',visitedDateRange:'2026',cityIds:['paris']};
  const day={id:'paris-visit',date:'2026-03-04',cityId:'paris',countryId:'france'};
  const entries=buildJourneyEntries([egypt,france],[{id:'paris'}],[day]);
  assert.deepEqual(entries.map(item=>item.date),['2026-03-04','2025-07']);
  assert.deepEqual(groupJourneyEntriesByYear(entries).map(item=>item.year),[2026,2025]);
});
