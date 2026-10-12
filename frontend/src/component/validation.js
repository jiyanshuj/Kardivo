export const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function validate(v) {
  const e = {};
  const name = v.name.trim();
  if (!v.college_code.trim() || !/^[A-Za-z0-9 -]{1,12}$/.test(v.college_code.trim())) e.college_code = "Institute code is required (max 12)";
  if (!name) e.name = "Name is required";
  else if (!/^[A-Za-z. ]+$/.test(name)) e.name = "Letters, spaces and dots only";
  else if (name.length > 40) e.name = "Max 40 characters";
  if (!v.blood_group) e.blood_group = "Select blood group";
  if (!/^[A-Z0-9]+$/.test(v.enrollment)) e.enrollment = "Alphanumeric only, required";
  if (!v.program.trim()) e.program = "Program is required";
  const m = /^(\d{4})-(\d{2})$/.exec(v.admission_year);
  if (!m || +m[2] !== (+m[1] + 1) % 100) e.admission_year = "Format YYYY-YY, e.g. 2022-23";
  if (!/^[6-9]\d{9}$/.test(v.mobile)) e.mobile = "Enter a valid 10-digit number";
  if (!/^[6-9]\d{9}$/.test(v.emergency)) e.emergency = "Enter a valid 10-digit number";
  else if (v.emergency === v.mobile) e.emergency = "Must differ from mobile number";
  if (!v.address.trim()) e.address = "Address is required";
  else if (v.address.length > 120) e.address = "Max 120 characters";
  return e;
}
