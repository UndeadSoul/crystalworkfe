import api from "../api";

/**
 * Descarga un archivo de la API (p. ej. un PDF). Se pide con axios para enviar
 * el token (un enlace directo no lo enviaría) y se guarda con `nombre`.
 * Si la API responde un error, se lanza con su cuerpo ya leído como JSON para
 * que parseApiError lo muestre igual que cualquier otro error.
 */
export async function descargarArchivo(url, nombre) {
  let respuesta;
  try {
    respuesta = await api.get(url, { responseType: "blob" });
  } catch (err) {
    const blob = err.response?.data;
    if (blob instanceof Blob) {
      try {
        err.response.data = JSON.parse(await blob.text());
      } catch {
        // Cuerpo no JSON: parseApiError usa el mensaje por defecto.
      }
    }
    throw err;
  }
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(respuesta.data);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

export const pdfCotizacion = (id) =>
  descargarArchivo(`/api/cotizaciones/${id}/pdf/`, `cotizacion-${id}.pdf`);

export const pdfProyecto = (id) =>
  descargarArchivo(`/api/proyectos/${id}/pdf/`, `proyecto-${id}.pdf`);

export const pdfHojaCorte = (id) =>
  descargarArchivo(`/api/proyectos/${id}/hoja-corte/pdf/`, `hoja-corte-proyecto-${id}.pdf`);
