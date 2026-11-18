import {createEngine} from '../index.js';

const key = 'chemistry-framework-inquiries';

const chemistryInquiries = {
  connect({data}) {
    return Object.freeze({
      read() {
        try {
          const records = data.read(key, []);
          return Array.isArray(records)
            ? records.filter(record => typeof record?.user_intuition === 'string')
            : [];
        } catch {
          return [];
        }
      },
      write(records) {
        if (!Array.isArray(records)) throw new TypeError('Expected an array of inquiry records');
        data.write(key, records);
      }
    });
  }
};

export function createChemistryInquiryStore(storage) {
  return createEngine({storage}).connect(chemistryInquiries);
}
