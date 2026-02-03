import dayjs from 'dayjs';

// Utility function to calculate annual final balance for an employee
export function calculateAnnualFinalBalance(
  netIjaza: number | null,
  netIjazaDesert: number | null,
  soldeJourCongeeDesert: number | null,
  spendsVacation: number | null,
  spendsFieldBreak: number | null
): number {
  // Example calculation, adjust as needed for your business logic
  const total =
    (netIjaza ?? 0) +
    (netIjazaDesert ?? 0) +
    (soldeJourCongeeDesert ?? 0) -
    (spendsVacation ?? 0) -
    (spendsFieldBreak ?? 0);

  return total;
}

// Function to calculate annual leave balance based on contract start, birth date, and spendsVacation
export function calculateAnnualLeaveBalance(
  startContract: string | null,
  birthDate: string | null,
  spendsVacation: number | null
): number {
  // If missing contract or birth date, default to 30 days
  let base = 30;
  const now = dayjs();
  let yearsExperience = 0;
  let age = 0;

  if (startContract) {
    yearsExperience = now.diff(dayjs(startContract), 'year');
  }
  if (birthDate) {
    age = now.diff(dayjs(birthDate), 'year');
  }

  if (yearsExperience >= 20 || age >= 50) {
    base = 45;
  }

  // Subtract spendsVacation (if any)
  const balance = base - (spendsVacation ?? 0);
  return balance < 0 ? 0 : balance;
}
