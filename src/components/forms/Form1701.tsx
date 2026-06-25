// Form1701.tsx — faithful 1701 replica. STUB: replaced by the faithful port.
import type { Comp1701 } from "../../lib/compute";
import type { FormProps } from "../formProps";

export function Form1701(_props: FormProps<Comp1701>) {
  return (
    <div
      className="bir-sheet"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 60, minHeight: 600 }}
    >
      <div style={{ fontSize: 46, fontWeight: 700, color: "#A0627D", fontFamily: "Arial" }}>1701</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color: "#2A2420" }}>Faithful form — porting in progress</div>
    </div>
  );
}
