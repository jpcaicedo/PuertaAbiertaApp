import { community, type Notice } from "@/lib/mock-data";

/**
 * Texto que se envía al compartir un aviso (I3) y que ve un vecino sin la app (I4).
 * Solo incluye el aviso: nunca datos de quien lo comparte.
 */
export function buildNoticeShareText(notice: Notice) {
  return [
    notice.title,
    notice.author,
    "",
    notice.shareSummary,
    "",
    "Recibe todos los avisos del conjunto en Puerta Abierta:",
    community.publicUrl,
  ].join("\n");
}

export function shareTargets(notice: Notice) {
  const text = buildNoticeShareText(notice);
  const encoded = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/?text=${encoded}`,
    // `?&body=` funciona tanto en iOS como en Android.
    sms: `sms:?&body=${encoded}`,
    email: `mailto:?subject=${encodeURIComponent(notice.title)}&body=${encoded}`,
    link: community.publicUrl,
  };
}
