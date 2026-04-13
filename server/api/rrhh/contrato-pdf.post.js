import { execFile } from "child_process";
import { join } from "path";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), "scripts", "generate_contrato.py");
    const python = process.platform === "win32" ? "python" : "python3";

    const child = execFile(python, [scriptPath], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error("Contrato PDF error:", stderr);
        reject(createError({ statusCode: 500, message: "Error generando contrato PDF: " + stderr }));
        return;
      }

      const pdfBuffer = Buffer.from(stdout, "binary");
      const tipo = body.tipo_contrato || "contrato";
      const rut  = body.trabajador?.rut?.replace(/\./g, "").replace(/-/g, "") || "doc";
      setResponseHeaders(event, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${tipo}-${rut}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      resolve(pdfBuffer);
    });

    child.stdin.write(JSON.stringify(body));
    child.stdin.end();
  });
});
