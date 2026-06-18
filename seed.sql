// Role capabilities, enforced inside each function.
export const ROLES = {
  sysadmin: ['*'],
  payroll: ['employee.read','employee.write','contractor.read','contractor.write','attendance.read','attendance.write','payroll.run','payroll.read','challan.read','challan.write','master.read','audit.read','document.read','document.write'],
  hr: ['employee.read','employee.write','contractor.read','attendance.read','attendance.write','master.read','payroll.read','document.read','document.write'],
  manager: ['employee.read','attendance.read','attendance.write','payroll.read','master.read'],
  finance: ['employee.read','contractor.read','payroll.read','challan.read','master.read','audit.read','document.read'],
  ess: ['self.read','document.read'],
};
export function can(role, action) {
  const caps = ROLES[role];
  if (!caps) return false;
  return caps.includes('*') || caps.includes(action);
}
