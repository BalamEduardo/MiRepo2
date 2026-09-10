function toPositiveNumber(value) {
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));

  return Number.isFinite(number) && number > 0 ? number : null;
}

function calculateImc(weightKg, heightCm) {
  const weight = toPositiveNumber(weightKg);
  const height = toPositiveNumber(heightCm);

  if (weight === null || height === null) {
    return null;
  }

  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function classifyImc(imc) {
  if (!Number.isFinite(imc) || imc <= 0) {
    return { label: "Sin datos", color: "#64748B" };
  }

  if (imc < 18.5) {
    return { label: "Bajo peso", color: "#F59E0B" };
  }

  if (imc < 25) {
    return { label: "Peso saludable", color: "#10B981" };
  }

  if (imc < 30) {
    return { label: "Sobrepeso", color: "#F97316" };
  }

  return { label: "Obesidad", color: "#EF4444" };
}

module.exports = { calculateImc, classifyImc };
