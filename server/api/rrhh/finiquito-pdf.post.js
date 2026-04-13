import { execFile } from "child_process";
import { join } from "path";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), "scripts", "generate_finiquito.py");
    const python = process.platform === "win32" ? "python" : "python3";

    const child = execFile(python, [scriptPath], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error("Finiquito PDF error:", stderr);
        reject(createError({ statusCode: 500, message: "Error generando finiquito PDF: " + stderr }));
        return;
      }

      const pdfBuffer = Buffer.from(stdout, "binary");
      const rut    = body.trabajador?.rut?.replace(/\./g, "").replace(/-/g, "") || "doc";
      const fecha  = (body.fecha_termino || "").slice(0, 10).replace(/-/g, "");
      setResponseHeaders(event, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="finiquito-${rut}-${fecha}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      resolve(pdfBuffer);
    });

    child.stdin.write(JSON.stringify(body));
    child.stdin.end();
  });
});
