#!/usr/bin/env python3
"""
Generador de Liquidación de Remuneraciones - Unabase
Recibe JSON por stdin, devuelve PDF bytes por stdout.
"""
import sys
import json
import io
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib.utils import ImageReader

def fmt_clp(value):
    """Formatea número como $1.200.000"""
    if value is None or value == 0:
        return "$0"
    try:
        n = int(value)
        return f"${n:,.0f}".replace(",", ".")
    except:
        return str(value)

def generate_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    PAGE_W, PAGE_H = A4  # 595 x 842 pt
    c = canvas.Canvas(buf, pagesize=A4)

    # ── Fuentes ──────────────────────────────────────────────────────────────
    FONT       = "Helvetica"
    FONT_BOLD  = "Helvetica-Bold"

    # ── Márgenes ─────────────────────────────────────────────────────────────
    ML = 20 * mm   # margen izquierdo
    MR = 20 * mm
    MT = 15 * mm
    CONTENT_W = PAGE_W - ML - MR  # ~555 pt

    # ── Datos ─────────────────────────────────────────────────────────────────
    org       = data.get("organizacion", {})
    trabajador = data.get("trabajador", {})
    liquidacion = data.get("liquidacion", {})
    haberes   = liquidacion.get("haberes", [])
    desc_leg  = liquidacion.get("descuentos_legales", [])
    otros_desc = liquidacion.get("otros_descuentos", [])
    aportes   = liquidacion.get("aportes", [])
    totales   = liquidacion.get("totales", {})
    pago      = liquidacion.get("pago", {})
    logo_b64  = data.get("logo_base64", None)

    # ── Y cursor (top-down) ───────────────────────────────────────────────────
    y = PAGE_H - MT

    # ══════════════════════════════════════════════════════════════════════════
    # 1. HEADER – Título + Logo
    # ══════════════════════════════════════════════════════════════════════════
    c.setFont(FONT_BOLD, 14)
    c.drawString(ML, y, "Liquidación de Remuneraciones")

    # Logo (si hay)
    if logo_b64:
        try:
            logo_data = base64.b64decode(logo_b64)
            logo_img  = ImageReader(io.BytesIO(logo_data))
            logo_h    = 12 * mm
            logo_w    = 40 * mm
            c.drawImage(logo_img, PAGE_W - MR - logo_w, y - 4*mm,
                        width=logo_w, height=logo_h, preserveAspectRatio=True, mask="auto")
        except:
            pass

    y -= 8 * mm

    # ══════════════════════════════════════════════════════════════════════════
    # 2. BLOQUE EMPRESA / PERÍODO
    # ══════════════════════════════════════════════════════════════════════════
    box_h = 22 * mm
    col1_w = CONTENT_W * 0.55
    col2_w = CONTENT_W * 0.45

    # Borde exterior
    c.setLineWidth(0.5)
    c.rect(ML, y - box_h, CONTENT_W, box_h)
    # Línea divisoria vertical
    c.line(ML + col1_w, y - box_h, ML + col1_w, y)

    # Empresa (izquierda)
    pad = 3 * mm
    ty  = y - 4 * mm
    c.setFont(FONT_BOLD, 9)
    c.drawString(ML + pad, ty, org.get("nombre", ""))
    ty -= 4.5 * mm
    c.setFont(FONT, 8.5)
    c.drawString(ML + pad, ty, f"Rut: {org.get('rut', '')}")
    ty -= 4.5 * mm
    c.drawString(ML + pad, ty, org.get("direccion", ""))

    # Período (derecha)
    rx = ML + col1_w + pad
    ty2 = y - 4 * mm
    c.setFont(FONT_BOLD, 9)
    c.drawString(rx, ty2, "Remuneraciones del Mes")
    ty2 -= 5 * mm
    c.setFont(FONT, 9)
    c.drawString(rx, ty2, liquidacion.get("periodo", ""))

    y -= box_h

    # ══════════════════════════════════════════════════════════════════════════
    # 3. DATOS DEL TRABAJADOR
    # ══════════════════════════════════════════════════════════════════════════
    worker_h = 26 * mm
    c.rect(ML, y - worker_h, CONTENT_W, worker_h)
    c.line(ML + col1_w, y - worker_h, ML + col1_w, y)

    # Izquierda
    LABEL_W = 24 * mm
    rows_l = [
        ("Nombre:",        trabajador.get("nombre", "").upper()),
        ("Cargo:",         trabajador.get("cargo", "")),
        ("L. de trabajo:", trabajador.get("lugar_trabajo", "")),
        ("C Costo:",       trabajador.get("centro_costo", "")),
    ]
    yl = y - 5 * mm
    for label, val in rows_l:
        c.setFont(FONT, 8)
        c.drawString(ML + pad, yl, label)
        c.setFont(FONT_BOLD if label == "Nombre:" else FONT, 8)
        c.drawString(ML + pad + LABEL_W, yl, val)
        yl -= 5.5 * mm

    # Derecha
    rows_r = [
        ("RUT:",              trabajador.get("rut", "")),
        ("Fecha de Ingreso:", trabajador.get("fecha_ingreso", "")),
        ("Días Trabajados:",  str(trabajador.get("dias_trabajados", 30))),
    ]
    yr = y - 5 * mm
    rx2 = ML + col1_w + pad
    for label, val in rows_r:
        c.setFont(FONT, 8)
        c.drawString(rx2, yr, label)
        c.setFont(FONT, 8)
        # Alinear valor
        c.drawString(rx2 + 30 * mm, yr, val)
        yr -= 5.5 * mm

    y -= worker_h

    # ══════════════════════════════════════════════════════════════════════════
    # 4. TABLA DE HABERES / DESCUENTOS
    # ══════════════════════════════════════════════════════════════════════════
    y -= 2 * mm

    COL_WIDTHS = [CONTENT_W * 0.52, CONTENT_W * 0.16, CONTENT_W * 0.16, CONTENT_W * 0.16]

    # Construir filas
    table_data = [
        # Header
        ["Detalle", "Aportes", "Haberes", "Descuentos"],
        # Haberes
        [("bold", "Haberes"), "", "", ""],
    ]
    for h in haberes:
        table_data.append(["  " + h.get("nombre", ""), "", fmt_clp(h.get("monto", 0)), ""])

    table_data.append([("bold", "Descuentos Legales"), "", "", ""])
    for d in desc_leg:
        table_data.append(["  " + d.get("nombre", ""), "", "", fmt_clp(d.get("monto", 0))])

    table_data.append([("bold", "Otros Descuentos"), "", "", ""])
    for d in otros_desc:
        table_data.append(["  " + d.get("nombre", ""), "", "", fmt_clp(d.get("monto", 0))])

    table_data.append([("bold", "Aportes"), "", "", ""])
    for a in aportes:
        table_data.append(["  " + a.get("nombre", ""), fmt_clp(a.get("monto", 0)), "", ""])

    table_data.append([
        ("right_bold", "Totales:"),
        fmt_clp(totales.get("aportes", 0)),
        fmt_clp(totales.get("haberes", 0)),
        fmt_clp(totales.get("descuentos", 0)),
    ])

    # Convertir a strings procesando bold/right_bold
    def process_cell(cell):
        if isinstance(cell, tuple):
            return cell[1]
        return cell

    table_rows = [[process_cell(cell) for cell in row] for row in table_data]

    # Crear tabla ReportLab
    table = Table(table_rows, colWidths=COL_WIDTHS)
    base_style = [
        # Header
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#e8e8e8")),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.black),
        ("FONTNAME",     (0, 0), (-1, 0), FONT_BOLD),
        ("FONTSIZE",     (0, 0), (-1, 0), 8),
        ("ALIGN",        (1, 0), (-1, 0), "CENTER"),
        # Body
        ("FONTNAME",     (0, 1), (-1, -1), FONT),
        ("FONTSIZE",     (0, 1), (-1, -1), 8),
        ("ALIGN",        (1, 1), (-1, -1), "RIGHT"),
        ("TOPPADDING",   (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        # Borders
        ("BOX",          (0, 0), (-1, -1), 0.5, colors.black),
        ("INNERGRID",    (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
        # Totales (última fila)
        ("BACKGROUND",   (0, -1), (-1, -1), colors.HexColor("#f0f0f0")),
        ("FONTNAME",     (0, -1), (-1, -1), FONT_BOLD),
        ("FONTNAME",     (1, -1), (-1, -1), FONT_BOLD),
    ]

    # Bold para filas de sección
    section_rows = []
    for i, row in enumerate(table_data):
        if isinstance(row[0], tuple) and row[0][0] == "bold":
            section_rows.append(i)
            base_style.append(("FONTNAME", (0, i), (0, i), FONT_BOLD))
            base_style.append(("SPAN", (0, i), (-1, i)))

    table.setStyle(TableStyle(base_style))

    # Medir alto de la tabla y dibujar
    table_w, table_h = table.wrapOn(c, CONTENT_W, PAGE_H)
    table.drawOn(c, ML, y - table_h)
    y -= table_h

    # ══════════════════════════════════════════════════════════════════════════
    # 5. LÍQUIDO A PAGAR
    # ══════════════════════════════════════════════════════════════════════════
    y -= 2 * mm
    liq_h = 8 * mm
    c.setLineWidth(0.5)
    c.rect(ML, y - liq_h, CONTENT_W, liq_h)
    c.setFont(FONT_BOLD, 9)
    c.drawString(ML + pad, y - 5.5 * mm, "Líquido a Pagar:")
    c.drawRightString(ML + CONTENT_W - pad, y - 5.5 * mm,
                      fmt_clp(liquidacion.get("liquido_a_pagar", 0)))
    y -= liq_h

    # ══════════════════════════════════════════════════════════════════════════
    # 6. PAGO + FIRMA
    # ══════════════════════════════════════════════════════════════════════════
    y -= 2 * mm
    pago_h = 26 * mm
    c.rect(ML, y - pago_h, CONTENT_W, pago_h)
    c.line(ML + col1_w, y - pago_h, ML + col1_w, y)

    # Izquierda – datos de pago
    pago_rows = [
        ("Fecha de pago:",   pago.get("fecha_pago", "")),
        ("Banco:",           pago.get("banco", "")),
        ("Tipo cuenta:",     pago.get("tipo_cuenta", "")),
        ("Numero cuenta:",   pago.get("numero_cuenta", "")),
    ]
    LABEL_P = 22 * mm
    yp = y - 5 * mm
    for label, val in pago_rows:
        c.setFont(FONT_BOLD, 8)
        c.drawRightString(ML + pad + LABEL_P, yp, label)
        c.setFont(FONT, 8)
        c.drawString(ML + pad + LABEL_P + 2 * mm, yp, val)
        yp -= 5.5 * mm

    # Derecha – firma
    rx3 = ML + col1_w + pad
    firma_y = y - 12 * mm
    firma_line_x2 = ML + CONTENT_W - pad
    c.setLineWidth(0.5)
    c.line(rx3 + 5 * mm, firma_y, firma_line_x2, firma_y)
    c.setFont(FONT, 8)
    c.drawCentredString((rx3 + 5 * mm + firma_line_x2) / 2, firma_y + 2 * mm, "Firma Trabajador")
    c.setFont(FONT, 7.5)
    text_center = (rx3 + 5 * mm + firma_line_x2) / 2
    c.drawCentredString(text_center, firma_y - 5 * mm,
                        "Declaro recibir conforme y sin reclamo alguno mi")
    c.drawCentredString(text_center, firma_y - 9.5 * mm, "remuneración mensual")

    # ══════════════════════════════════════════════════════════════════════════
    c.save()
    buf.seek(0)
    return buf.read()


if __name__ == "__main__":
    raw = sys.stdin.read()
    data = json.loads(raw)
    pdf_bytes = generate_pdf(data)
    sys.stdout.buffer.write(pdf_bytes)
