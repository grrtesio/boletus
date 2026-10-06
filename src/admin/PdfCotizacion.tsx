import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { EstadoCotizacion } from "./supabase";
import { ESTADO_EN_PDF, REGISTRO_POR_ESTADO, fechaLarga, pesosPdf, type DatosDocumento } from "./documentos-api";

/*
 * EL PDF DE COTIZACIÓN. Replica el documento de muestra de Boletus
 * («Cotizacion_Boletus_Desmalezado.pdf», 16-sep-2026): logo a la izquierda,
 * título a la derecha, barra verde, tabla de datos, alcance con viñetas verdes,
 * recuadro del valor total, condiciones, recuadro «Registro del acuerdo» y pie.
 *
 * Tipografía Helvetica (viene con el PDF, no hay que descargar nada). Colores de
 * la muestra: verde de la barra y las viñetas #9fb58a, grises #333/#555/#777.
 */

// Sin partir palabras con guion («Villa Ale-mana»): se corta por espacios.
Font.registerHyphenationCallback((palabra) => [palabra]);

const VERDE = "#9fb58a";
const VERDE_OSCURO = "#6f8a5c";
const GRIS_FONDO = "#f4f5f1";
const GRIS_BORDE = "#e3e6de";

const s = StyleSheet.create({
  pagina: { fontFamily: "Helvetica", fontSize: 10, color: "#333333", paddingTop: 40, paddingBottom: 64, paddingHorizontal: 56 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 },
  logo: { width: 118 },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 19, color: "#3a3a3a", textAlign: "right" },
  subtitulo: { fontSize: 11, color: "#666666", textAlign: "right", marginTop: 4 },
  estado: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#555555", textAlign: "right", marginTop: 6 },
  barra: { height: 4, backgroundColor: VERDE, marginBottom: 20 },

  tabla: { borderWidth: 1, borderColor: GRIS_BORDE, backgroundColor: GRIS_FONDO, marginBottom: 22 },
  fila: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ffffff" },
  rotulo: { flexGrow: 0, flexShrink: 0, flexBasis: 88, paddingVertical: 11, paddingHorizontal: 10, fontFamily: "Helvetica-Bold", fontSize: 8, color: "#777777", justifyContent: "center" },
  valor: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingVertical: 11, paddingHorizontal: 10, fontSize: 10, color: "#222222", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "#ffffff" },
  rotulo2: { flexBasis: 108, borderLeftWidth: 1, borderLeftColor: "#ffffff" },
  valor2: { flexGrow: 0, flexShrink: 0, flexBasis: 132 },

  h2: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#3a3a3a", marginBottom: 8 },
  item: { flexDirection: "row", marginBottom: 4.5, paddingLeft: 12 },
  punto: { width: 12, color: VERDE_OSCURO, fontSize: 11, lineHeight: 1.35 },
  itemTexto: { flex: 1, fontSize: 10, color: "#333333", lineHeight: 1.4 },

  total: { marginTop: 14, marginBottom: 22, borderWidth: 1.5, borderColor: VERDE, backgroundColor: "#f3f7ee", paddingVertical: 16, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalTitulo: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#333333", marginBottom: 4 },
  totalDesc: { fontSize: 8.5, color: "#555555" },
  totalMonto: { fontFamily: "Helvetica-Bold", fontSize: 24, color: "#333333", textAlign: "right" },
  totalMoneda: { fontSize: 8.5, color: "#777777", textAlign: "right", marginTop: 6 },

  condicion: { fontSize: 8.5, color: "#555555", lineHeight: 1.5, marginBottom: 5, paddingLeft: 2 },
  condicionEtiqueta: { fontFamily: "Helvetica-Bold", color: "#444444" },

  registro: { marginTop: 14, borderWidth: 1, borderColor: GRIS_BORDE, backgroundColor: GRIS_FONDO, paddingVertical: 12, paddingHorizontal: 14 },
  registroTitulo: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#333333", marginBottom: 5 },
  registroTexto: { fontSize: 10, color: "#333333", lineHeight: 1.45 },

  pie: { position: "absolute", left: 56, right: 56, bottom: 34, borderTopWidth: 1, borderTopColor: GRIS_BORDE, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  pieTexto: { fontSize: 7.5, color: "#888888" },
});

export function PdfCotizacion({ datos, estado, logo }: { datos: DatosDocumento; estado: EstadoCotizacion; logo: string }) {
  const alcance = datos.alcance.map((t) => t.trim()).filter(Boolean);
  const condiciones = datos.condiciones.filter((c) => c.etiqueta.trim() || c.texto.trim());
  return (
    <Document title={`Cotización Boletus — ${datos.titulo || "Servicio"}`} author="Boletus" subject={`Cotización para ${datos.cliente}`} language="es-CL">
      <Page size="A4" style={s.pagina}>
        <View style={s.cabecera}>
          <Image src={logo} style={s.logo} />
          <View>
            <Text style={s.titulo}>COTIZACIÓN DE SERVICIOS</Text>
            {datos.titulo ? <Text style={s.subtitulo}>{datos.titulo}</Text> : null}
            <Text style={s.estado}>ESTADO: {ESTADO_EN_PDF[estado]}</Text>
          </View>
        </View>
        <View style={s.barra} />

        <View style={s.tabla}>
          <View style={s.fila}>
            <View style={s.rotulo}><Text>Cliente</Text></View>
            <View style={s.valor}><Text>{datos.cliente || "—"}</Text></View>
            <View style={[s.rotulo, s.rotulo2]}><Text>Fecha de emisión</Text></View>
            <View style={[s.valor, s.valor2]}><Text>{fechaLarga(datos.fecha_emision)}</Text></View>
          </View>
          <View style={[s.fila, { borderBottomWidth: 0 }]}>
            <View style={s.rotulo}><Text>Ubicación</Text></View>
            <View style={s.valor}><Text>{datos.ubicacion || "—"}</Text></View>
            <View style={[s.rotulo, s.rotulo2]}><Text>Superficie referencial</Text></View>
            <View style={[s.valor, s.valor2]}><Text>{datos.superficie || "—"}</Text></View>
          </View>
        </View>

        <Text style={s.h2}>Alcance del servicio</Text>
        {alcance.length ? alcance.map((t, i) => (
          <View key={i} style={s.item} wrap={false}>
            <Text style={s.punto}>•</Text>
            <Text style={s.itemTexto}>{t}</Text>
          </View>
        )) : <Text style={[s.itemTexto, { paddingLeft: 12 }]}>—</Text>}

        <View style={s.total} wrap={false}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={s.totalTitulo}>Valor total acordado</Text>
            {datos.valor_descripcion ? <Text style={s.totalDesc}>{datos.valor_descripcion}</Text> : null}
          </View>
          <View>
            <Text style={s.totalMonto}>{pesosPdf(datos.valor)}</Text>
            <Text style={s.totalMoneda}>CLP</Text>
          </View>
        </View>

        {condiciones.length ? (
          <View>
            <Text style={s.h2}>Condiciones del servicio</Text>
            {condiciones.map((c, i) => (
              <Text key={i} style={s.condicion}>
                {"• "}
                {c.etiqueta.trim() ? <Text style={s.condicionEtiqueta}>{c.etiqueta.trim()}: </Text> : null}
                {c.texto.trim()}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={s.registro} wrap={false}>
          <Text style={s.registroTitulo}>Registro del acuerdo</Text>
          <Text style={s.registroTexto}>{REGISTRO_POR_ESTADO[estado]}</Text>
        </View>

        <View style={s.pie} fixed>
          <Text style={s.pieTexto}>Documento digital emitido para registro del servicio acordado.</Text>
          <Text style={s.pieTexto}>Boletus</Text>
        </View>
      </Page>
    </Document>
  );
}
