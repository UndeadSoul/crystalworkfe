// Utilidades para interpretar el rol del usuario en el frontend.
// El backend expone `rol` (JEFE / OPERARIO) e `is_superuser` (administrador
// del sistema).

export const ROLES = {
  ADMIN: "ADMIN",
  JEFE: "JEFE",
  OPERARIO: "OPERARIO",
};

export const ROLE_LABELS = {
  ADMIN: "Administrador",
  JEFE: "Jefe",
  OPERARIO: "Operario",
};

export function roleKey(user) {
  if (!user) return null;
  if (user.is_superuser) return ROLES.ADMIN;
  return user.rol || null;
}

export function roleLabel(user) {
  return ROLE_LABELS[roleKey(user)] || "Usuario";
}
