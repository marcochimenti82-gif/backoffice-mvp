import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function syncReservation(reservationId: string): Promise<void> {
  // MVP: DB direct + optional call to core internal endpoint
  if (!env.CORE_API_BASE_URL) {
    logger.info({ reservationId }, "CORE_API_BASE_URL not set; skipping calendar sync (TODO adapter)");
    return;
  }

  try {
    const url = new URL("/internal/calendar/sync-reservation", env.CORE_API_BASE_URL).toString();
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-token": env.CORE_INTERNAL_TOKEN
      },
      body: JSON.stringify({ reservation_id: reservationId })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      logger.warn({ reservationId, status: resp.status, text }, "Calendar sync failed");
    } else {
      logger.info({ reservationId }, "Calendar sync ok");
    }
  } catch (err) {
    logger.warn({ reservationId, err }, "Calendar sync error");
  }
}
