export function resolveServicioImg(imagenUrl: string | null | undefined): string {
  const clean = (imagenUrl ?? '').trim();
  if (!clean) return '/img/servicios/consulta-diagnostico.png';
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
    return clean;
  }
  if (clean.startsWith('img/')) {
    return `/${clean}`;
  }
  return `/img/servicios/${clean}`;
}

export function resolveOdontologoImg(fotoUrl: string | null | undefined): string {
  const clean = (fotoUrl ?? '').trim();
  if (!clean) return '/img/odontologos/carlos-mendoza.webp';
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
    return clean;
  }
  if (clean.startsWith('img/')) {
    return `/${clean}`;
  }
  return `/img/odontologos/${clean}`;
}

export function formatHoraCorta(hora: string | null | undefined): string {
  if (!hora) return '--:--';
  return hora.slice(0, 5);
}

export function getTomorrowIsoDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
