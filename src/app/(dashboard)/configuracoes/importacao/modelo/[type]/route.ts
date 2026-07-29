import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { generateCsv } from "@/lib/importacao/csv";
import { buildXlsx } from "@/lib/spreadsheet/xlsx";
import { IMPORT_TEMPLATES, type ImportType } from "@/lib/importacao/types";

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  await requirePermission("settings_access");

  const { type } = await params;
  const template = IMPORT_TEMPLATES[type as ImportType];
  if (!template) {
    return NextResponse.json({ error: "Modelo não encontrado." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("formato");

  if (format === "xlsx") {
    const bytes = await buildXlsx({
      sheetName: template.label,
      headers: template.headers,
      rows: [template.example],
    });

    return new NextResponse(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="modelo-${template.type}.xlsx"`,
      },
    });
  }

  const csv = `﻿${generateCsv([template.headers, template.example])}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="modelo-${template.type}.csv"`,
    },
  });
}
