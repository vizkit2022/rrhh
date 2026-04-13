#!/usr/bin/env python3
"""
generate_finiquito.py
Genera finiquitos de trabajo profesionales para Chile.
Lee JSON desde stdin, escribe bytes PDF a stdout.

Motivos soportados:
  mutuo_acuerdo, renuncia_voluntaria, vencimiento_plazo,
  conclusion_trabajo, muerte_trabajador, caso_fortuito,
  despido_disciplinario, necesidades_empresa
"""

import sys
import json
import base64
import io
from datetime import datetime

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

# ── Colores ───────────────────────────────────────────────────────────────────
TEAL      = colors.HexColor("#2a9d8f")
TEAL_DARK = colors.HexColor("#1f7a6e")
GRAY_DARK = colors.HexColor("#1e2a35")
GRAY_MID  = colors.HexColor("#4a5568")
GRAY_LIGHT= colors.HexColor("#e2e8f0")
RED_SOFT  = colors.HexColor("#e53e3e")
WHITE     = colors.white
BLACK     = colors.black

# ── Motivos de término ────────────────────────────────────────────────────────
MOTIVOS_INFO = {
    "mutuo_acuerdo": {
        "label": "Mutuo Acuerdo de las Partes",
        "articulo": "Art. 159 N°1 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "Las partes, de común acuerdo y en forma libre y espontánea, ponen término "
            "al contrato de trabajo que las ha unido, sin que medie presión ni apremio "
            "de ninguna especie."
        ),
    },
    "renuncia_voluntaria": {
        "label": "Renuncia Voluntaria del Trabajador",
        "articulo": "Art. 159 N°2 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "El trabajador, en forma libre y voluntaria, pone término al contrato de trabajo "
            "que lo vinculaba con el empleador, presentando la correspondiente renuncia con "
            "a lo menos 30 días de anticipación, según corresponda."
        ),
    },
    "vencimiento_plazo": {
        "label": "Vencimiento del Plazo Convenido",
        "articulo": "Art. 159 N°4 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "El contrato de trabajo celebrado a plazo fijo entre las partes ha llegado a su "
            "término en la fecha pactada originalmente, sin que las partes hayan renovado o "
            "transformado la relación laboral."
        ),
    },
    "conclusion_trabajo": {
        "label": "Conclusión del Trabajo o Servicio",
        "articulo": "Art. 159 N°5 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "La obra, faena o servicio específico que motivó la contratación ha concluido, "
            "por lo que se pone término al contrato de trabajo de conformidad a lo pactado "
            "en el mismo."
        ),
    },
    "muerte_trabajador": {
        "label": "Muerte del Trabajador",
        "articulo": "Art. 159 N°3 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "El contrato de trabajo se extingue por el fallecimiento del trabajador, "
            "procediéndose a liquidar los haberes correspondientes a sus herederos "
            "conforme a la ley."
        ),
    },
    "caso_fortuito": {
        "label": "Caso Fortuito o Fuerza Mayor",
        "articulo": "Art. 159 N°6 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "El contrato de trabajo se pone término por caso fortuito o fuerza mayor "
            "debidamente acreditado, situación que hace imposible la continuación de "
            "la relación laboral."
        ),
    },
    "despido_disciplinario": {
        "label": "Despido Disciplinario (Justa Causa)",
        "articulo": "Art. 160 Código del Trabajo",
        "aplica_mes_aviso": False,
        "aplica_indemnizacion_legal": False,
        "texto": (
            "El empleador pone término al contrato de trabajo invocando una o más de las "
            "causales establecidas en el artículo 160 del Código del Trabajo, sin derecho "
            "a indemnización por años de servicio."
        ),
    },
    "necesidades_empresa": {
        "label": "Necesidades de la Empresa",
        "articulo": "Art. 161 Código del Trabajo",
        "aplica_mes_aviso": True,
        "aplica_indemnizacion_legal": True,
        "texto": (
            "El empleador pone término al contrato de trabajo por necesidades de la empresa, "
            "establecimiento o servicio, tales como las derivadas de la racionalización o "
            "modernización de los mismos, bajas en la productividad, cambios en las condiciones "
            "del mercado o de la economía, que hagan necesaria la separación de uno o más "
            "trabajadores, conforme al artículo 161 del Código del Trabajo."
        ),
    },
}

# ── Estilos ───────────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()
    s = {}

    s["title"] = ParagraphStyle(
        "title", parent=base["Normal"],
        fontSize=15, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_CENTER,
        spaceAfter=4,
    )
    s["subtitle"] = ParagraphStyle(
        "subtitle", parent=base["Normal"],
        fontSize=10, fontName="Helvetica-Bold",
        textColor=TEAL, alignment=TA_CENTER,
        spaceAfter=2,
    )
    s["partes"] = ParagraphStyle(
        "partes", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=14, spaceAfter=8,
    )
    s["section_title"] = ParagraphStyle(
        "section_title", parent=base["Normal"],
        fontSize=10, fontName="Helvetica-Bold",
        textColor=WHITE, alignment=TA_LEFT,
        spaceBefore=2, spaceAfter=2,
    )
    s["body"] = ParagraphStyle(
        "body", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=14, spaceAfter=6,
    )
    s["body_bold"] = ParagraphStyle(
        "body_bold", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_JUSTIFY,
        leading=14, spaceAfter=4,
    )
    s["label"] = ParagraphStyle(
        "label", parent=base["Normal"],
        fontSize=8.5, fontName="Helvetica-Bold",
        textColor=GRAY_MID, alignment=TA_LEFT,
        spaceAfter=1,
    )
    s["value"] = ParagraphStyle(
        "value", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_LEFT,
        spaceAfter=6,
    )
    s["monto_label"] = ParagraphStyle(
        "monto_label", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica",
        textColor=GRAY_DARK, alignment=TA_LEFT,
    )
    s["monto_valor"] = ParagraphStyle(
        "monto_valor", parent=base["Normal"],
        fontSize=9.5, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_RIGHT,
    )
    s["total_label"] = ParagraphStyle(
        "total_label", parent=base["Normal"],
        fontSize=11, fontName="Helvetica-Bold",
        textColor=WHITE, alignment=TA_LEFT,
    )
    s["total_valor"] = ParagraphStyle(
        "total_valor", parent=base["Normal"],
        fontSize=11, fontName="Helvetica-Bold",
        textColor=WHITE, alignment=TA_RIGHT,
    )
    s["footer"] = ParagraphStyle(
        "footer", parent=base["Normal"],
        fontSize=8, fontName="Helvetica",
        textColor=GRAY_MID, alignment=TA_CENTER,
    )
    s["sign_name"] = ParagraphStyle(
        "sign_name", parent=base["Normal"],
        fontSize=9, fontName="Helvetica-Bold",
        textColor=GRAY_DARK, alignment=TA_CENTER,
    )
    s["sign_role"] = ParagraphStyle(
        "sign_role", parent=base["Normal"],
        fontSize=8.5, fontName="Helvetica",
        textColor=GRAY_MID, alignment=TA_CENTER,
    )
    return s


# ── Utilidades ────────────────────────────────────────────────────────────────
MESES_ES = [
    "", "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
]

def fmt_date(d):
    if not d: return "—"
    try:
        dt = datetime.strptime(str(d)[:10], "%Y-%m-%d")
        return f"{dt.day} de {MESES_ES[dt.month]} de {dt.year}"
    except:
        return str(d)

def fmt_clp(n):
    if n is None: return "$0"
    try:
        return f"${int(n):,}".replace(",", ".")
    except:
        return str(n)

def p(text, style):
    return Paragraph(text, style)

def sp(h=0.3):
    return Spacer(1, h * cm)

def section_bar(label, styles, width=17.5):
    """Barra teal con texto blanco como encabezado de sección."""
    tbl = Table([[p(label, styles["section_title"])]], colWidths=[width*cm], rowHeights=[0.65*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), TEAL),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))
    return tbl

def info_row(label, value, styles, col_widths=None):
    """Fila de 2 columnas: etiqueta gris | valor oscuro."""
    if col_widths is None:
        col_widths = [5*cm, 12.5*cm]
    tbl = Table(
        [[p(label, styles["label"]), p(str(value), styles["value"])]],
        colWidths=col_widths,
    )
    tbl.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("LINEBELOW", (0,0), (-1,-1), 0.3, GRAY_LIGHT),
    ]))
    return tbl

def monto_row(label, valor, styles, is_descuento=False, col_widths=None):
    """Fila de importe con label izquierda y valor derecha."""
    if col_widths is None:
        col_widths = [11*cm, 6.5*cm]
    color = RED_SOFT if is_descuento else GRAY_DARK
    vstyle = ParagraphStyle(
        "mv_tmp", parent=styles["monto_valor"],
        textColor=color,
    )
    prefix = "−" if is_descuento else ""
    tbl = Table(
        [[p(label, styles["monto_label"]), p(f"{prefix}{valor}", vstyle)]],
        colWidths=col_widths,
    )
    tbl.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("LINEBELOW", (0,0), (-1,-1), 0.3, GRAY_LIGHT),
    ]))
    return tbl


# ── Encabezado ────────────────────────────────────────────────────────────────
def build_header(data, styles):
    org  = data.get("organizacion", {})
    logo = data.get("logo_base64")

    elements = []

    # Barra superior teal
    bar = Table([[""]], colWidths=[17.5*cm], rowHeights=[0.5*cm])
    bar.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), TEAL)]))
    elements.append(bar)
    elements.append(sp(0.4))

    # Logo + título
    if logo:
        try:
            img_data = base64.b64decode(logo)
            from reportlab.platypus import Image
            img_io = io.BytesIO(img_data)
            img = Image(img_io, width=3.5*cm, height=1.4*cm, kind="proportional")
            header_tbl = Table(
                [[img, p("FINIQUITO DE TRABAJO", styles["title"])]],
                colWidths=[4*cm, 13.5*cm],
            )
        except:
            header_tbl = Table(
                [[p("FINIQUITO DE TRABAJO", styles["title"])]],
                colWidths=[17.5*cm],
            )
    else:
        header_tbl = Table(
            [[p("FINIQUITO DE TRABAJO", styles["title"])]],
            colWidths=[17.5*cm],
        )

    header_tbl.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE")]))
    elements.append(header_tbl)
    elements.append(sp(0.2))
    elements.append(p(org.get("nombre", ""), styles["subtitle"]))
    elements.append(sp(0.15))

    # Línea separadora
    elements.append(HRFlowable(width="100%", thickness=1.5, color=TEAL))
    elements.append(sp(0.4))

    return elements


# ── Sección: Partes ───────────────────────────────────────────────────────────
def build_partes(data, styles):
    org  = data.get("organizacion", {})
    trab = data.get("trabajador", {})
    motivo_key = data.get("motivo_termino", "mutuo_acuerdo")
    motivo = MOTIVOS_INFO.get(motivo_key, MOTIVOS_INFO["mutuo_acuerdo"])

    elements = []
    elements.append(section_bar("IDENTIFICACIÓN DE LAS PARTES", styles))
    elements.append(sp(0.3))

    # Tabla plana 4 columnas: label_emp | val_emp | label_trab | val_trab
    rows_data = [
        ("Empleador:",          f"<b>{org.get('nombre','—')}</b>",
         "Trabajador:",         f"<b>{trab.get('nombre_completo','—')}</b>"),
        ("RUT Empleador:",      org.get("rut","—"),
         "RUT Trabajador:",     trab.get("rut","—")),
        ("Representante:",      org.get("representante","—"),
         "Cargo:",              trab.get("cargo","—")),
        ("Giro:",               org.get("giro","—"),
         "Fecha Ingreso:",      fmt_date(trab.get("fecha_ingreso"))),
        ("Domicilio Emp.:",     org.get("domicilio","—"),
         "Domicilio Trab.:",    trab.get("domicilio","—")),
    ]

    col_w = [2.8*cm, 5.6*cm, 2.8*cm, 5.6*cm]
    tbl_rows = []
    for l1, v1, l2, v2 in rows_data:
        tbl_rows.append([
            p(l1, styles["label"]), p(v1, styles["partes"]),
            p(l2, styles["label"]), p(v2, styles["partes"]),
        ])

    tbl = Table(tbl_rows, colWidths=col_w)
    tbl.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("LINEBELOW", (0,0), (-1,-2), 0.3, GRAY_LIGHT),
        ("LINEBEFORE", (2,0), (2,-1), 0.5, GRAY_LIGHT),
        ("BOX", (0,0), (-1,-1), 0.5, GRAY_LIGHT),
    ]))
    elements.append(tbl)
    elements.append(sp(0.5))

    return elements


# ── Sección: Motivo de Término ────────────────────────────────────────────────
def build_motivo(data, styles):
    motivo_key = data.get("motivo_termino", "mutuo_acuerdo")
    motivo = MOTIVOS_INFO.get(motivo_key, MOTIVOS_INFO["mutuo_acuerdo"])
    fecha_termino = data.get("fecha_termino")
    fecha_aviso   = data.get("fecha_aviso")

    elements = []
    elements.append(section_bar("CAUSAL Y FECHA DE TÉRMINO", styles))
    elements.append(sp(0.3))

    elements.append(info_row("Causal:", f"{motivo['label']}", styles))
    elements.append(info_row("Artículo:", motivo["articulo"], styles))
    elements.append(info_row("Fecha de Término:", fmt_date(fecha_termino), styles))

    if motivo["aplica_mes_aviso"]:
        aviso_txt = fmt_date(fecha_aviso) if fecha_aviso else "No aplica aviso previo"
        elements.append(info_row("Mes de Aviso:", aviso_txt, styles))

    elements.append(sp(0.3))
    elements.append(p(motivo["texto"], styles["body"]))
    elements.append(sp(0.3))

    return elements


# ── Sección: Liquidación / Haberes ────────────────────────────────────────────
def build_liquidacion(data, styles):
    liq = data.get("liquidacion", {})
    descuentos_list = data.get("descuentos_finiquito", [])

    elements = []
    elements.append(section_bar("LIQUIDACIÓN DE HABERES", styles))
    elements.append(sp(0.3))

    # Calcular total haberes
    dias_trabajados     = liq.get("dias_trabajados", 0)
    sueldo_base         = liq.get("sueldo_base", 0)
    sueldo_proporcional = liq.get("sueldo_proporcional", 0)
    vacaciones_dias     = liq.get("vacaciones_pendientes_dias", 0)
    vacaciones_monto    = liq.get("vacaciones_pendientes_monto", 0)
    gratificacion       = liq.get("gratificacion_proporcional", 0)
    indemnizacion_legal = liq.get("indemnizacion_anos_servicio", 0)
    sustitutiva_aviso   = liq.get("sustitutiva_mes_aviso", 0)
    indemnizacion_vol   = liq.get("indemnizacion_voluntaria", 0)
    anos_servicio       = liq.get("anos_servicio", 0)

    # Días trabajados en el mes
    if dias_trabajados and sueldo_base:
        lbl_prop = (
            f"Sueldo Proporcional "
            f"({dias_trabajados} días trabajados)"
        )
    else:
        lbl_prop = "Sueldo Proporcional"

    items_haber = []
    if sueldo_proporcional:
        items_haber.append((lbl_prop, sueldo_proporcional))
    if vacaciones_monto:
        lbl_vac = f"Vacaciones Pendientes ({vacaciones_dias} días)" if vacaciones_dias else "Vacaciones Pendientes"
        items_haber.append((lbl_vac, vacaciones_monto))
    if gratificacion:
        items_haber.append(("Gratificación Proporcional", gratificacion))
    if indemnizacion_legal:
        lbl_ind = f"Indemnización por Años de Servicio ({anos_servicio} año(s))"
        items_haber.append((lbl_ind, indemnizacion_legal))
    if sustitutiva_aviso:
        items_haber.append(("Indemnización Sustitutiva del Mes de Aviso", sustitutiva_aviso))
    if indemnizacion_vol:
        items_haber.append(("Indemnización Voluntaria Adicional", indemnizacion_vol))

    for lbl, val in items_haber:
        elements.append(monto_row(lbl, fmt_clp(val), styles))

    # Descuentos
    total_descuentos = 0
    if descuentos_list:
        elements.append(sp(0.2))
        for desc in descuentos_list:
            monto = desc.get("monto", 0)
            motivo = desc.get("motivo", "Descuento")
            total_descuentos += monto
            elements.append(monto_row(motivo, fmt_clp(monto), styles, is_descuento=True))

    # Total a pagar
    total_haberes = sum(v for _,v in items_haber)
    total_pagar = total_haberes - total_descuentos

    elements.append(sp(0.3))

    # Barra de total
    total_tbl = Table(
        [[
            p("TOTAL A PAGAR", styles["total_label"]),
            p(fmt_clp(total_pagar), styles["total_valor"]),
        ]],
        colWidths=[11*cm, 6.5*cm],
        rowHeights=[0.9*cm],
    )
    total_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), TEAL_DARK),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (0,0), 10),
        ("RIGHTPADDING", (-1,0), (-1,-1), 10),
    ]))
    elements.append(total_tbl)
    elements.append(sp(0.5))

    # Nota si fallecido
    motivo_key = data.get("motivo_termino", "")
    if motivo_key == "muerte_trabajador":
        elements.append(p(
            "<i>* Los montos indicados serán pagados a los herederos del trabajador "
            "conforme al procedimiento legal vigente (Art. 60 Código del Trabajo).</i>",
            styles["body"],
        ))
        elements.append(sp(0.2))

    return elements


# ── Sección: Declaraciones ────────────────────────────────────────────────────
def build_declaraciones(data, styles):
    motivo_key = data.get("motivo_termino", "mutuo_acuerdo")
    motivo = MOTIVOS_INFO.get(motivo_key, MOTIVOS_INFO["mutuo_acuerdo"])

    elements = []
    elements.append(section_bar("DECLARACIONES Y FINIQUITO", styles))
    elements.append(sp(0.3))

    if motivo_key != "muerte_trabajador":
        elements.append(p(
            "El trabajador declara haber recibido a su entera satisfacción el total de "
            "los haberes consignados en el presente instrumento, no teniendo nada más "
            "que reclamar por concepto de remuneraciones, gratificaciones, indemnizaciones, "
            "bonos, horas extraordinarias, feriado legal ni ningún otro beneficio derivado "
            "del contrato de trabajo que puso fin.",
            styles["body"],
        ))
        elements.append(sp(0.2))

        if motivo_key == "necesidades_empresa":
            elements.append(p(
                "<b>Aviso de Término:</b> El empleador comunicó el término de contrato "
                "con la anticipación legal correspondiente, o en su defecto, se incluyó "
                "la indemnización sustitutiva del aviso previo.",
                styles["body"],
            ))
            elements.append(sp(0.2))

        elements.append(p(
            "Leído y ratificado el presente documento, las partes lo firman en dos ejemplares "
            "de un mismo tenor y fecha, quedando uno en poder de cada parte.",
            styles["body"],
        ))
    else:
        elements.append(p(
            "El presente finiquito se suscribe para dar cuenta del término de la relación "
            "laboral por fallecimiento del trabajador, procediendo al pago de los montos "
            "correspondientes a sus sucesores o herederos conforme a la ley.",
            styles["body"],
        ))

    elements.append(sp(0.4))
    return elements


# ── Firmas ────────────────────────────────────────────────────────────────────
def build_signatures(data, styles):
    org  = data.get("organizacion", {})
    trab = data.get("trabajador", {})
    motivo_key = data.get("motivo_termino", "mutuo_acuerdo")

    elements = []

    # Si fallecido, mostrar solo firma empleador + heredero/notario
    if motivo_key == "muerte_trabajador":
        left_block  = [p("_"*40, styles["sign_name"]),
                       p(org.get("representante","—"), styles["sign_name"]),
                       p("Representante Legal Empleador", styles["sign_role"]),
                       p(f"RUT: {org.get('rut','—')}", styles["sign_role"])]
        right_block = [p("_"*40, styles["sign_name"]),
                       p("Heredero / Representante Legal", styles["sign_name"]),
                       p("Sucesión del Trabajador", styles["sign_role"])]
    else:
        left_block  = [p("_"*40, styles["sign_name"]),
                       p(org.get("representante","—"), styles["sign_name"]),
                       p("Representante Legal Empleador", styles["sign_role"]),
                       p(f"RUT: {org.get('rut','—')}", styles["sign_role"])]
        right_block = [p("_"*40, styles["sign_name"]),
                       p(trab.get("nombre_completo","—"), styles["sign_name"]),
                       p("Trabajador", styles["sign_role"]),
                       p(f"RUT: {trab.get('rut','—')}", styles["sign_role"])]

    def cell(items):
        inner = [[item] for item in items]
        t = Table(inner, colWidths=[8*cm])
        t.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
            ("TOPPADDING", (0,0), (-1,-1), 4),
        ]))
        return t

    sig_tbl = Table(
        [[cell(left_block), Spacer(1.5*cm, 1), cell(right_block)]],
        colWidths=[8*cm, 1.5*cm, 8*cm],
    )
    sig_tbl.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    elements.append(sig_tbl)
    elements.append(sp(0.8))

    # Ministro de fe (si aplica)
    ministro = data.get("ministro_fe", False)
    if ministro:
        fe_tbl = Table(
            [[p("_"*40, styles["sign_name"])]],
            colWidths=[17.5*cm],
        )
        fe_tbl.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER")]))
        elements.append(fe_tbl)
        elements.append(p("Ministro de Fe / Inspector del Trabajo", styles["sign_role"]))
        elements.append(sp(0.5))

    return elements


# ── Pie de página ─────────────────────────────────────────────────────────────
def build_footer(data, styles):
    org  = data.get("organizacion", {})
    fecha = fmt_date(data.get("fecha_emision") or datetime.today().strftime("%Y-%m-%d"))

    elements = []
    elements.append(HRFlowable(width="100%", thickness=0.5, color=GRAY_LIGHT))
    elements.append(sp(0.15))
    elements.append(p(
        f"{org.get('nombre','—')} · {org.get('rut','—')} · {org.get('domicilio','—')} · "
        f"Emitido el {fecha}",
        styles["footer"],
    ))
    return elements


# ── Generador principal ───────────────────────────────────────────────────────
def generate_pdf(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=1.5*cm,
        bottomMargin=2*cm,
        title="Finiquito de Trabajo",
        author=data.get("organizacion", {}).get("nombre", ""),
    )

    styles   = make_styles()
    story    = []

    story += build_header(data, styles)
    story += build_partes(data, styles)
    story += build_motivo(data, styles)
    story += build_liquidacion(data, styles)
    story += build_declaraciones(data, styles)
    story.append(KeepTogether(build_signatures(data, styles)))
    story += build_footer(data, styles)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    raw = sys.stdin.buffer.read()
    data = json.loads(raw.decode("utf-8"))
    pdf_bytes = generate_pdf(data)
    sys.stdout.buffer.write(pdf_bytes)
