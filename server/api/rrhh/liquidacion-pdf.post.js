import { execFile } from "child_process";
import { join } from "path";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), "scripts", "generate_liquidacion.py");
    const python = process.platform === "win32" ? "python" : "python3";

    const child = execFile(python, [scriptPath], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error("PDF generation error:", stderr);
        reject(createError({ statusCode: 500, message: "Error generando PDF: " + stderr }));
        return;
      }

      const pdfBuffer = Buffer.from(stdout, "binary");
      setResponseHeaders(event, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="liquidacion-${body.trabajador?.rut || "doc"}-${body.liquidacion?.periodo || "periodo"}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      resolve(pdfBuffer);
    });

    // Enviar datos JSON por stdin
    child.stdin.write(JSON.stringify(body));
    child.stdin.end();
  });
});
