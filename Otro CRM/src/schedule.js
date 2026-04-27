/**
 * Gestión de horarios y zona horaria
 */

/**
 * Comprueba si estamos fuera del horario de oficina (20:00 - 8:00 hora España)
 */
function isOffHours() {
  const now = new Date();

  // Obtener hora en zona horaria de Madrid
  const madridTime = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: 'numeric',
    hour12: false
  }).format(now);

  const hour = parseInt(madridTime, 10);

  // Fuera de horario: de 20:00 a 7:59
  return hour >= 20 || hour < 8;
}

/**
 * Comprueba si hoy es fin de semana en España
 */
function isWeekend() {
  const now = new Date();
  const madridDay = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'short'
  }).format(now);

  return madridDay === 'sáb' || madridDay === 'dom' ||
         madridDay === 'sab' || madridDay === 'sá';
}

/**
 * Devuelve si estamos fuera de servicio (fuera de horario O fin de semana)
 * Ajusta según tu política: si también trabajas fines de semana, elimina isWeekend
 */
function isOutOfService() {
  return isOffHours(); // Añadir || isWeekend() si no trabajas fines de semana
}

/**
 * Hora actual formateada en Madrid
 */
function getMadridTime() {
  return new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
}

module.exports = { isOffHours, isWeekend, isOutOfService, getMadridTime };
