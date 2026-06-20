import prisma from '../config/db';

const DELETE_AFTER_MS = 60 * 60 * 1000; // 1 hora en milisegundos
const CHECK_INTERVAL_MS = 60 * 1000;    // Revisar cada minuto

/**
 * Elimina automáticamente los picks que fueron marcados como ganados (WON)
 * hace más de 1 hora por el tipster.
 *
 * Esto mantiene el feed limpio y añade urgencia para los apostadores:
 * una vez que el tipster da por ganado el pick, los interesados tienen
 * 1 hora para verlo antes de que desaparezca.
 */
async function deleteResolvedPicks(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - DELETE_AFTER_MS);

    // Buscar picks completados (WON) con resolvedAt hace más de 1 hora
    const expired = await prisma.prediction.findMany({
      where: {
        isCompleted: true,
        result: 'WON',
        resolvedAt: {
          not: null,
          lte: cutoff,
        },
      },
      select: { id: true, sport: true, league: true, resolvedAt: true },
    });

    if (expired.length === 0) return;

    const ids = expired.map((p) => p.id);

    // Prisma borrará en cascada: Purchase → Transaction gracias a onDelete: Cascade
    const { count } = await prisma.prediction.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(
      `[Scheduler] ✅ ${count} pick(s) WON eliminados automáticamente (>1h después de resolverse):`,
      expired.map((p) => `${p.sport}/${p.league} [${p.id.substring(0, 8)}]`).join(', ')
    );
  } catch (err) {
    console.error('[Scheduler] ❌ Error al eliminar picks expirados:', err);
  }
}

/**
 * Inicia el scheduler. Llama a esta función una sola vez al arrancar el servidor.
 */
export function startScheduler(): void {
  console.log('[Scheduler] 🕐 Iniciado — revisará cada minuto y eliminará picks WON >1h.');

  // Ejecutar de inmediato al arrancar (limpia cualquier pick que haya quedado pendiente)
  deleteResolvedPicks();

  // Luego repetir cada minuto
  setInterval(deleteResolvedPicks, CHECK_INTERVAL_MS);
}
