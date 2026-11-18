const gasConstant = 8.31446261815324;
const faradayConstant = 96485.33212;
const standardPotential = 1.100;

export function cellPotential({ temperatureK = 298.15, aZn2 = 1, aCu2 = 1 } = {}) {
  if (!Number.isFinite(temperatureK) || temperatureK < 273.15 || temperatureK > 373.15) {
    throw new RangeError('Temperature must be 273.15–373.15 K');
  }
  for (const [name, value] of [['Zn²⁺ activity', aZn2], ['Cu²⁺ activity', aCu2]]) {
    if (!Number.isFinite(value) || value < 0.01 || value > 10) {
      throw new RangeError(`${name} must be 0.01–10`);
    }
  }
  const n = 2;
  const Q = aZn2 / aCu2;
  const E = standardPotential - (gasConstant * temperatureK / (n * faradayConstant)) * Math.log(Q);
  return { E, Q, n, temperatureK };
}
