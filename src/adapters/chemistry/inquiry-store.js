import { createJsonDocument } from '../../data/json-document.js';

const key = 'chemistry-framework-inquiries';
const isRecord = item => typeof item?.user_intuition === 'string';

export function createChemistryInquiryStore({ getStorage }) {
  const document = createJsonDocument({ getStorage, key });
  return {
    read() {
      try {
        const records = document.read();
        return Array.isArray(records) ? records.filter(isRecord) : [];
      } catch {
        return [];
      }
    },

    replace(records) {
      if (!Array.isArray(records) || !records.every(isRecord)) {
        throw new TypeError('Expected a Chemistry Framework inquiry array');
      }
      document.replace(records);
    }
  };
}
