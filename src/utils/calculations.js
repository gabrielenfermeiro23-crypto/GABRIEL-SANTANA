// src/utils/calculations.js

/**
 * Calcula a porcentagem de gordura (%BF) e massa magra (kg)
 * Fórmula: Jackson & Pollock (4 dobras: triceps, subscapular, suprailiaca, abdominal) + Siri
 */
export function calculateBodyComposition({
  triceps,
  subscapular,
  suprailiac,
  abdominal,
  weight,
  age,
  gender
}) {
  const t = parseFloat(triceps) || 0;
  const sub = parseFloat(subscapular) || 0;
  const sup = parseFloat(suprailiac) || 0;
  const abd = parseFloat(abdominal) || 0;
  const w = parseFloat(weight) || 0;

  // Exige que o peso e as 4 dobras estejam preenchidos para calcular
  if (!t || !sub || !sup || !abd || !w) return null;

  const sumFold = t + sub + sup + abd;
  const userAge = age ? parseInt(age, 10) : 25;
  const normalizedGender = gender?.toLowerCase() || '';
  const isFemale =
    normalizedGender === 'feminino' ||
    normalizedGender === 'femenino' ||
    normalizedGender === 'f';

  let bodyDensity = 0;
  if (isFemale) {
    bodyDensity =
      1.096095 -
      0.0006952 * sumFold +
      0.0000011 * sumFold ** 2 -
      0.0000714 * userAge;
  } else {
    bodyDensity =
      1.107268 -
      0.000812 * sumFold +
      0.00000212 * sumFold ** 2 -
      0.0002574 * userAge;
  }

  const fatPercent = (4.95 / bodyDensity - 4.5) * 100;

  if (fatPercent > 0 && fatPercent < 60) {
    const fatKg = (w * fatPercent) / 100;
    const muscleKg = w - fatKg;

    return {
      fatPercentage: fatPercent.toFixed(1),
      muscleMass: muscleKg.toFixed(1)
    };
  }

  return null;
}