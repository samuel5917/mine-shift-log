import { EquipmentIcon } from "@/components/EquipmentIcon";
import logo from "@/assets/trindade-logo.png";
import {
  CATEGORY_TITLE,
  SITUATION_DOC_STYLE,
  SITUATION_LABEL,
  SHIFT_LABEL,
  formatDateBR,
  type Category,
  type Situation,
} from "@/lib/domain";

export interface SheetLine {
  id: string;
  code: string;
  name: string;
  type_prefix: string;
  category: string;
  situation: Situation;
  operation_front: string;
  parking_front: string;
}

interface Props {
  lines: SheetLine[];
  reportDate: string;
  shift: number;
  showParking: boolean;
  logoUrl: string | null | undefined;
}

const BORDER = "1px solid #000000";

function Section({
  title,
  lines,
  showParking,
  logoUrl,
  reportDate,
  shift,
}: {
  title: string;
  lines: SheetLine[];
  showParking: boolean;
  logoUrl: string | null | undefined;
  reportDate: string;
  shift: number;
}) {
  const cols = 3 + (showParking ? 1 : 0);
  return (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        tableLayout: "fixed",
        fontFamily: "Calibri, Arial, sans-serif",
        fontSize: 15,
        color: "#000",
        background: "#fff",
        marginBottom: 28,
      }}
    >
      <colgroup>
        <col style={{ width: 300 }} />
        <col style={{ width: 130 }} />
        <col />
        {showParking ? <col style={{ width: 240 }} /> : null}
      </colgroup>
      <tbody>
        <tr>
          <td style={{ border: BORDER, padding: "10px 12px", verticalAlign: "middle" }} rowSpan={2}>
            <img
              src={logoUrl || logo}
              alt="Trindade Mineração"
              style={{ height: 46, objectFit: "contain" }}
            />
          </td>
          <td
            style={{
              border: BORDER,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 26,
              padding: "6px 8px",
            }}
            colSpan={cols - 1}
          >
            Informe de Turno
          </td>
        </tr>
        <tr>
          <td
            style={{
              border: BORDER,
              textAlign: "center",
              fontWeight: 700,
              fontSize: 19,
              padding: "4px 8px",
            }}
            colSpan={cols - 1}
          >
            {title}
          </td>
        </tr>
        <tr>
          <td style={{ border: BORDER, textAlign: "center", fontWeight: 700, padding: "4px 8px" }}>
            Equipamento
          </td>
          <td style={{ border: BORDER, textAlign: "center", fontWeight: 700, padding: "4px 8px" }}>
            Situação
          </td>
          <td style={{ border: BORDER, fontWeight: 700, padding: "4px 8px" }}>
            Frente de Operação
          </td>
          {showParking ? (
            <td
              style={{ border: BORDER, textAlign: "center", fontWeight: 700, padding: "4px 8px" }}
            >
              Frente de estacionamento
            </td>
          ) : null}
        </tr>
        {lines.map((l) => {
          const st = SITUATION_DOC_STYLE[l.situation];
          return (
            <tr key={l.id}>
              <td
                style={{
                  border: BORDER,
                  fontWeight: 700,
                  padding: "3px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <EquipmentIcon prefix={l.type_prefix} size={16} />
                  <span>
                    {l.code} - {l.name}
                  </span>
                </span>
              </td>
              <td
                style={{
                  border: BORDER,
                  padding: "3px 8px",
                  fontWeight: 700,
                  textAlign: "center",
                  background: st.bg,
                  color: st.color,
                }}
              >
                {SITUATION_LABEL[l.situation]}
              </td>
              <td style={{ border: BORDER, padding: "3px 8px" }}>{l.operation_front}</td>
              {showParking ? (
                <td style={{ border: BORDER, padding: "3px 8px" }}>{l.parking_front}</td>
              ) : null}
            </tr>
          );
        })}
        <tr>
          <td
            colSpan={cols}
            style={{ border: BORDER, padding: "4px 8px", fontSize: 13, textAlign: "right" }}
          >
            {formatDateBR(reportDate)} — {SHIFT_LABEL[shift]}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ReportSheet({ lines, reportDate, shift, showParking, logoUrl }: Props) {
  const groups: Category[] = ["auxiliar", "producao"];
  return (
    <div style={{ background: "#fff", padding: 24, width: 1180 }}>
      {groups.map((cat) => {
        const group = lines.filter((l) => l.category === cat);
        if (group.length === 0) return null;
        return (
          <Section
            key={cat}
            title={CATEGORY_TITLE[cat]}
            lines={group}
            showParking={cat === "producao" ? showParking : false}
            logoUrl={logoUrl}
            reportDate={reportDate}
            shift={shift}
          />
        );
      })}
    </div>
  );
}
