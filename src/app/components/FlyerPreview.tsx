import { MapPin, Clock, CheckCircle2, AlertCircle, XCircle, Shield, CalendarCheck, BadgeCheck } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import headerLogo from "@/imports/559396B6-DC97-4CDB-B084-438FD89BE0B6.png";

export type EventStatus = "CONFIRMADO" | "EM_ANALISE" | "CANCELADO";

export interface AuctionEvent {
  id: string;
  title: string;
  company: string;
  date: string;
  time: string;
  location: string;
  logoUrl: string | null;
  status: EventStatus;
}

// Quantos eventos cabem por página
export const MAX_EVENTS_FIRST_PAGE = 5;
export const MAX_EVENTS_CONT_PAGE  = 8;

interface FlyerPreviewProps {
  events: AuctionEvent[];
  customLogoUrl: string | null;
  isFirstPage: boolean;
  isLastPage: boolean;
}

// Dourado quente próximo ao da logomarca
const GOLD   = "#9A6A06";   // bordas / divisores
const GOLDBR = "#C8860B";   // destaque médio
const GOLDTX = "#D4960E";   // texto principal dourado

const MONTH_ABBR = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: d, month: MONTH_ABBR[m - 1], year: y };
}

function isExpired(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

const STATUS_CONFIG = {
  CONFIRMADO: { label: "CONFIRMADO",      icon: <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />, color: "#22c55e" },
  EM_ANALISE: { label: "EM ANÁLISE",      icon: <AlertCircle  className="w-4 h-4" style={{ color: "#f59e0b" }} />, color: "#f59e0b" },
  CANCELADO:  { label: "DATA DISPONÍVEL", icon: <XCircle      className="w-4 h-4" style={{ color: "#ef4444" }} />, color: "#ef4444" },
};

export function FlyerPreview({ events, customLogoUrl, isFirstPage, isLastPage }: FlyerPreviewProps) {
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden rounded-lg shadow-2xl select-none"
      style={{ background: "#0d0d0d", fontFamily: "'Inter', sans-serif", minHeight: 0 }}
    >

      {/* ══ CABEÇALHO COMPLETO — só na primeira página ══ */}
      {isFirstPage && (
        <div style={{ background: "#0d0d0d" }}>
          {/* Logo + título */}
          <div className="flex items-center gap-4 px-4 pt-4 pb-3">
            {/* Logo sem moldura, tamanho máximo */}
            <div className="flex-shrink-0" style={{ width: 108, height: 108 }}>
              {customLogoUrl ? (
                <img
                  src={customLogoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageWithFallback
                  src={headerLogo}
                  alt="Adriano Apolinário"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Texto */}
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: GOLDBR }}>
                AGENDA DE
              </p>
              <h1
                className="font-black leading-none tracking-wider"
                style={{
                  color: GOLDTX,
                  fontSize: "clamp(1.1rem, 3vw, 1.55rem)",
                  textShadow: `0 0 20px ${GOLDBR}66`,
                }}
              >
                LEILÕES
              </h1>
              <p className="text-xs mt-1 leading-tight" style={{ color: "#ccc" }}>
                Confira a agenda e garanta sua reserva
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: GOLDTX }}>
                com Adriano Apolinário
              </p>
            </div>
          </div>

          {/* Ícones institucionais no cabeçalho */}
          <div
            className="flex items-center justify-around px-4 py-2"
            style={{ background: "#111", borderTop: `1px solid ${GOLD}55`, borderBottom: `1px solid ${GOLD}55` }}
          >
            {[
              { icon: <BadgeCheck    className="w-3.5 h-3.5" />, label: "Leiloeiro Público/Rural" },
              { icon: <CalendarCheck className="w-3.5 h-3.5" />, label: "Agenda Sempre Atualizada" },
              { icon: <Shield        className="w-3.5 h-3.5" />, label: "Segurança e Transparência" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-0.5" style={{ maxWidth: 80 }}>
                <div style={{ color: GOLDTX }}>{item.icon}</div>
                <span className="text-center leading-tight" style={{ color: "#bbb", fontSize: "0.5rem" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TÍTULO DA SEÇÃO ══ */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#1a1a1a" }}>
        <CalendarCheck className="w-4 h-4 flex-shrink-0" style={{ color: GOLDTX }} />
        <span className="text-xs font-bold tracking-widest" style={{ color: GOLDTX }}>
          LEILÕES CADASTRADOS
        </span>
      </div>

      {/* ══ LISTA DE EVENTOS ══ */}
      <div className="flex-1 px-3 py-2 space-y-2" style={{ minHeight: 0 }}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs" style={{ color: "#666" }}>Nenhum leilão cadastrado</p>
          </div>
        ) : (
          events.map((ev) => {
            const { day, month, year } = parseDate(ev.date);
            const cfg = STATUS_CONFIG[ev.status];
            const isCancelled = ev.status === "CANCELADO";

            return (
              <div
                key={ev.id}
                className="flex items-center gap-2 rounded-md overflow-hidden"
                style={{
                  background: isCancelled ? "#1a0f0f" : "#1c1c1c",
                  border: `1px solid ${isCancelled ? "#3a1a1a" : "#2a2a2a"}`,
                }}
              >
                {/* Bloco de data */}
                <div
                  className="flex-shrink-0 flex flex-col items-center justify-center px-2 py-3"
                  style={{
                    background: isCancelled ? "#160a0a" : "#111",
                    minWidth: 46,
                    borderRight: `1px solid ${isCancelled ? "#3a1a1a" : "#2a2a2a"}`,
                  }}
                >
                  <span
                    className="font-black leading-none"
                    style={{ color: isCancelled ? "#ef4444" : GOLDTX, fontSize: "1.2rem" }}
                  >
                    {String(day).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-bold" style={{ color: isCancelled ? "#c04040" : GOLDBR }}>
                    {month}
                  </span>
                  {/* Ano mais claro */}
                  <span className="text-xs" style={{ color: "#aaa" }}>{year}</span>
                </div>

                {/* Logo da empresa */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded"
                  style={{ width: 46, height: 40, background: "#fff", padding: 3, opacity: isCancelled ? 0.45 : 1 }}
                >
                  {ev.logoUrl ? (
                    <img src={ev.logoUrl} alt={ev.company} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-center font-bold leading-tight" style={{ color: "#333", fontSize: "0.48rem" }}>
                      {ev.company.slice(0, 8)}
                    </span>
                  )}
                </div>

                {/* Detalhes */}
                <div className="flex-1 py-1.5 min-w-0">
                  {isCancelled ? (
                    <>
                      <p className="font-semibold truncate leading-tight line-through" style={{ color: "#666", fontSize: "0.7rem" }}>
                        {ev.title}
                      </p>
                      <p className="font-bold leading-tight" style={{ color: "#ef4444", fontSize: "0.62rem" }}>
                        🔓 Esta data voltou a ficar disponível
                      </p>
                      {/* Empresa mais clara */}
                      <p className="truncate" style={{ color: "#888", fontSize: "0.6rem" }}>{ev.company}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold truncate leading-tight" style={{ color: "#f0f0f0", fontSize: "0.7rem" }}>
                        {ev.title}
                      </p>
                      {/* Empresa mais clara */}
                      <p className="truncate" style={{ color: "#bbb", fontSize: "0.62rem" }}>{ev.company}</p>
                    </>
                  )}
                  {/* Cidade mais clara */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#999" }} />
                    <span className="truncate" style={{ color: "#bbb", fontSize: "0.6rem" }}>{ev.location}</span>
                  </div>
                  {/* Horário mais claro */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#999" }} />
                    <span style={{ color: "#bbb", fontSize: "0.6rem" }}>{ev.time}h</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 pr-2 flex flex-col items-center gap-0.5">
                  {cfg.icon}
                  <span
                    className="font-bold text-center leading-tight"
                    style={{ color: cfg.color, fontSize: "0.43rem", letterSpacing: "0.03em", maxWidth: 46 }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ══ CTA WHATSAPP — rodapé apenas na última página ══ */}
      {isLastPage && <div
        className="mx-3 mb-3 mt-1 rounded-md px-3 py-2.5 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, #1c1400, #2e1f00)",
          border: `1px solid ${GOLDBR}`,
          boxShadow: `0 0 10px ${GOLD}44`,
        }}
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#25D366" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div>
          {/* Texto do rodapé maior e mais claro */}
          <p
            className="font-black leading-tight"
            style={{ color: GOLDTX, fontSize: "0.7rem", letterSpacing: "0.05em" }}
          >
            VERIFIQUE SE AS DATAS RESERVADAS PARA SUA EMPRESA ESTÃO CORRETAS
          </p>
          <p style={{ color: "#ccc", fontSize: "0.62rem", marginTop: 2 }}>
            Em caso de dúvidas ou necessidade de alteração, entre em contato o quanto antes.
          </p>
        </div>
      </div>}

    </div>
  );
}

// Divide array em páginas respeitando os limites
export function splitEventsIntoPages(events: AuctionEvent[]): AuctionEvent[][] {
  if (events.length === 0) return [[]];
  const pages: AuctionEvent[][] = [];
  let remaining = [...events];

  // Primeira página
  pages.push(remaining.splice(0, MAX_EVENTS_FIRST_PAGE));

  // Páginas de continuação
  while (remaining.length > 0) {
    pages.push(remaining.splice(0, MAX_EVENTS_CONT_PAGE));
  }

  return pages;
}
