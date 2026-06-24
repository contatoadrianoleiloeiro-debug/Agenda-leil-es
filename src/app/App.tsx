import { useEffect, useRef, useState } from "react";
import { toJpeg, toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  FlyerPreview,
  AuctionEvent,
  EventStatus,
  splitEventsIntoPages,
} from "./components/FlyerPreview";
import { EventForm } from "./components/EventForm";

const STORAGE_KEY_EVENTS = "agenda_events_v1";
const STORAGE_KEY_LOGO   = "agenda_logo_v1";

function loadEvents(): AuctionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (raw) return JSON.parse(raw) as AuctionEvent[];
  } catch { /* ignore */ }
  return FALLBACK_EVENTS;
}

function loadLogo(): string | null {
  try { return localStorage.getItem(STORAGE_KEY_LOGO); } catch { return null; }
}

function saveEvents(events: AuctionEvent[]) {
  try { localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events)); } catch { /* quota exceeded */ }
}

function saveLogo(url: string | null) {
  try {
    if (url) localStorage.setItem(STORAGE_KEY_LOGO, url);
    else localStorage.removeItem(STORAGE_KEY_LOGO);
  } catch { /* quota exceeded */ }
}

// Lista vazia como fallback — dados reais vêm sempre do localStorage
const FALLBACK_EVENTS: AuctionEvent[] = [];

// ─── helpers ───────────────────────────────────────────────────────────────

const CAPTURE_OPTS = {
  cacheBust: true,
  backgroundColor: "#0d0d0d",
  pixelRatio: 2,
} as const;

// Temporarily removes the fixed height so all content renders before capture
async function captureFullHeight(
  el: HTMLElement,
  format: "png" | "jpeg",
): Promise<string> {
  const prev = el.style.height;
  el.style.height = "auto";
  await sleep(60); // let browser reflow

  const fn = format === "png" ? toPng : toJpeg;
  const opts = format === "jpeg" ? { ...CAPTURE_OPTS, quality: 0.95 } : CAPTURE_OPTS;

  // First pass warms up font/image cache; second pass is the real capture
  await fn(el, opts).catch(() => null);
  const dataUrl = await fn(el, opts);

  el.style.height = prev;
  return dataUrl;
}

// Triggers a file download from a data URL (more reliable than Blob URLs for
// multiple sequential downloads, which browsers tend to throttle)
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function isExpired(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

// ─── component ─────────────────────────────────────────────────────────────

export default function App() {
  const [events, setEvents] = useState<AuctionEvent[]>(loadEvents);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(loadLogo);
  // Persist whenever events or logo change
  useEffect(() => { saveEvents(events); }, [events]);
  useEffect(() => { saveLogo(customLogoUrl); }, [customLogoUrl]);

  const [filterCompany, setFilterCompany] = useState<string | null>(null);
  const [sharing,   setSharing]   = useState(false);
  const [savingPDF, setSavingPDF] = useState(false);
  const [savingJPG, setSavingJPG] = useState(false);

  // Um ref por página de flyer
  const flyerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleAddEvent = (event: Omit<AuctionEvent, "id">) =>
    setEvents((prev) => [...prev, { ...event, id: crypto.randomUUID() }]);

  const handleRemoveEvent = (id: string) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  const handleUpdateEvent = (id: string, event: Omit<AuctionEvent, "id">) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...event } : e)));

  const handleChangeStatus = (id: string, status: EventStatus) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setCustomLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  function getRefs(): HTMLDivElement[] {
    return flyerRefs.current.slice(0, pages.length).filter(Boolean) as HTMLDivElement[];
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────
  const handleWhatsAppShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const els = getRefs();
      if (!els.length) throw new Error("Nenhuma página encontrada.");

      const dataUrls: string[] = [];
      for (const el of els) dataUrls.push(await captureFullHeight(el, "png"));

      const files = dataUrls.map((url, i) => {
        const blob = dataUrlToBlob(url);
        return new File([blob], `agenda-leiloes-p${i + 1}.png`, { type: "image/png" });
      });

      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: "Agenda de Leilões" });
      } else {
        for (let i = 0; i < dataUrls.length; i++) {
          downloadDataUrl(dataUrls[i], `agenda-leiloes-p${i + 1}.png`);
          if (i < dataUrls.length - 1) await sleep(1200);
        }
        alert(
          `✅ ${dataUrls.length > 1 ? `${dataUrls.length} imagens baixadas` : "Imagem baixada"} com sucesso!\n\n` +
          `Para enviar pelo WhatsApp Web:\n` +
          `1. Abra web.whatsapp.com\n` +
          `2. Escolha a conversa\n` +
          `3. Clique no clipe 📎 e anexe ${dataUrls.length > 1 ? "as imagens" : "a imagem"}.`,
        );
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar o flyer. Tente novamente.");
    } finally {
      setSharing(false);
    }
  };

  // ── Salvar JPG ─────────────────────────────────────────────────────────
  const handleSaveJPG = async () => {
    if (savingJPG) return;
    setSavingJPG(true);
    try {
      const els = getRefs();
      if (!els.length) throw new Error("Nenhuma página encontrada.");
      for (let i = 0; i < els.length; i++) {
        const dataUrl = await captureFullHeight(els[i], "jpeg");
        const suffix = els.length > 1 ? `-p${i + 1}` : "";
        downloadDataUrl(dataUrl, `agenda-leiloes${suffix}.jpg`);
        if (i < els.length - 1) await sleep(1200);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar JPG.");
    } finally {
      setSavingJPG(false);
    }
  };

  // ── Salvar PDF ─────────────────────────────────────────────────────────
  const handleSavePDF = async () => {
    if (savingPDF) return;
    setSavingPDF(true);
    try {
      const els = getRefs();
      if (!els.length) throw new Error("Nenhuma página encontrada.");

      const MM = 25.4 / 96; // px → mm at 96 dpi
      let pdf: jsPDF | null = null;

      for (let i = 0; i < els.length; i++) {
        const dataUrl = await captureFullHeight(els[i], "jpeg");
        // Measure the element AFTER auto-height capture (height is restored by then)
        const wPx = els[i].offsetWidth * 2;  // ×2 because pixelRatio=2
        const hPx = els[i].offsetHeight * 2;
        const wMM = wPx * MM;
        const hMM = hPx * MM;

        if (!pdf) {
          pdf = new jsPDF({
            orientation: hPx >= wPx ? "portrait" : "landscape",
            unit: "mm",
            format: [wMM, hMM],
          });
        } else {
          pdf.addPage([wMM, hMM]);
        }
        pdf.addImage(dataUrl, "JPEG", 0, 0, wMM, hMM);
      }

      pdf!.save("agenda-leiloes.pdf");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF.");
    } finally {
      setSavingPDF(false);
    }
  };

  // ── Paginação dos eventos (com filtro opcional por empresa) ───────────
  const activeEvents = events
    .filter((e) => !isExpired(e.date))
    .filter((e) => !filterCompany || e.company === filterCompany)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pages = splitEventsIntoPages(activeEvents);

  // Lista de empresas únicas (para o filtro)
  const companies = Array.from(new Set(events.map((e) => e.company).filter(Boolean))).sort();

  return (
    <div className="size-full bg-gray-100 p-3 md:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ── COLUNA DE PREVIEW (flyers empilhados com scroll) ── */}
          <div
            className="bg-white rounded-2xl shadow-xl p-4 flex flex-col"
            style={{ height: "90vh" }}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex-shrink-0">
              Preview do Flyer
            </p>

            <div
              className="flyer-scroll-container flex-1 space-y-4 rounded-lg"
              style={{
                overflowY: "scroll",
                scrollbarWidth: "thin",
                scrollbarColor: "#C8860B #f0f0f0",
                paddingRight: 6,
              }}
            >
              {pages.map((pageEvents, pageIndex) => (
                <div
                  key={pageIndex}
                  ref={(el) => { flyerRefs.current[pageIndex] = el; }}
                  className="rounded-lg overflow-hidden flex-shrink-0"
                  style={{ height: 660 }}
                >
                  <FlyerPreview
                    events={pageEvents}
                    customLogoUrl={customLogoUrl}
                    isFirstPage={pageIndex === 0}
                    isLastPage={pageIndex === pages.length - 1}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── FORMULÁRIO ── */}
          <div className="bg-white rounded-2xl shadow-xl p-5 sticky top-4">
            <EventForm
              events={events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onRemoveEvent={handleRemoveEvent}
              onChangeStatus={handleChangeStatus}
              companies={companies}
              filterCompany={filterCompany}
              onFilterCompany={setFilterCompany}
              customLogoUrl={customLogoUrl}
              onLogoUpload={handleLogoUpload}
              onWhatsAppShare={handleWhatsAppShare}
              onSavePDF={handleSavePDF}
              onSaveJPG={handleSaveJPG}
              sharing={sharing}
              savingPDF={savingPDF}
              savingJPG={savingJPG}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
