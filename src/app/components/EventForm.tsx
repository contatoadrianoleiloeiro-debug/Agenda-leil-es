import {
  Upload, Plus, Trash2, Pencil, MapPin, Clock, Building2, Type,
  Calendar, Send, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, XCircle,
  FileDown, ImageDown, X,
} from "lucide-react";
import { ChangeEvent, useState } from "react";
import type { AuctionEvent, EventStatus } from "./FlyerPreview";

interface EventFormProps {
  events: AuctionEvent[];
  onAddEvent: (event: Omit<AuctionEvent, "id">) => void;
  onUpdateEvent: (id: string, event: Omit<AuctionEvent, "id">) => void;
  onRemoveEvent: (id: string) => void;
  onChangeStatus: (id: string, status: EventStatus) => void;
  companies: string[];
  filterCompany: string | null;
  onFilterCompany: (company: string | null) => void;
  customLogoUrl: string | null;
  onLogoUpload: (file: File) => void;
  onWhatsAppShare: () => void;
  onSavePDF: () => void;
  onSaveJPG: () => void;
  sharing: boolean;
  savingPDF: boolean;
  savingJPG: boolean;
}

const emptyForm = {
  title: "",
  company: "",
  date: "",
  time: "",
  location: "",
  logoUrl: null as string | null,
};

type FormState = typeof emptyForm;

const STATUS_OPTIONS: {
  value: EventStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  { value: "CONFIRMADO", label: "Confirmado", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#16a34a", bg: "#f0fdf4" },
  { value: "EM_ANALISE", label: "Em Análise", icon: <AlertCircle  className="w-3.5 h-3.5" />, color: "#d97706", bg: "#fffbeb" },
  { value: "CANCELADO",  label: "Cancelado",  icon: <XCircle      className="w-3.5 h-3.5" />, color: "#dc2626", bg: "#fef2f2" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm";

export function EventForm({
  events,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
  onChangeStatus,
  companies,
  filterCompany,
  onFilterCompany,
  customLogoUrl,
  onLogoUpload,
  onWhatsAppShare,
  onSavePDF,
  onSaveJPG,
  sharing,
  savingPDF,
  savingJPG,
}: EventFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const startEditing = (ev: AuctionEvent) => {
    setForm({
      title: ev.title,
      company: ev.company,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      logoUrl: ev.logoUrl,
    });
    setEditingId(ev.id);
    setShowForm(true);
    // Scroll the form into view
    setTimeout(() => {
      document.getElementById("event-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const cancelEditing = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEventLogoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, logoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleHeaderLogoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLogoUpload(file);
  };

  const handleSubmit = () => {
    if (!form.title || !form.date) return;
    const payload = {
      title: form.title,
      company: form.company,
      date: form.date,
      time: form.time || "00:00",
      location: form.location,
      logoUrl: form.logoUrl,
      status: "CONFIRMADO" as EventStatus,
    };
    if (editingId) {
      // Preserve current status when updating
      const existing = events.find((e) => e.id === editingId);
      onUpdateEvent(editingId, { ...payload, status: existing?.status ?? "CONFIRMADO" });
      setEditingId(null);
    } else {
      onAddEvent(payload);
    }
    setForm(emptyForm);
    const input = document.getElementById("event-logo") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Editor de Agenda</h2>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie os leilões e personalize o flyer</p>
      </div>

      {/* ── LOGO DO CABEÇALHO ── */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Logo do Cabeçalho</h3>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleHeaderLogoFile} className="hidden" id="header-logo" />
          <label
            htmlFor="header-logo"
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-yellow-500 text-sm text-gray-500 hover:text-yellow-700 transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            {customLogoUrl ? "Alterar logo do cabeçalho" : "Upload da logo do cabeçalho"}
          </label>
          {customLogoUrl && (
            <img
              src={customLogoUrl}
              alt="Logo atual"
              className="h-12 w-20 object-contain rounded-lg border border-gray-200 bg-white p-1"
            />
          )}
        </div>
      </div>

      {/* ── ADICIONAR / EDITAR LEILÃO ── */}
      <div id="event-form-section" className="border border-gray-200 rounded-xl overflow-hidden">
        <div
          className={`flex items-center justify-between px-4 py-3 ${editingId ? "bg-blue-50" : "bg-yellow-50"}`}
        >
          <button
            onClick={() => { if (!editingId) setShowForm((v) => !v); }}
            className="flex-1 flex items-center gap-2 text-sm font-semibold text-left"
            style={{ color: editingId ? "#1d4ed8" : "#92400e" }}
          >
            {editingId
              ? <><Pencil className="w-4 h-4" /> Editar Leilão</>
              : <><Plus   className="w-4 h-4" /> Adicionar Novo Leilão</>}
          </button>
          {editingId ? (
            <button
              onClick={cancelEditing}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Cancelar edição"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setShowForm((v) => !v)} className="text-yellow-700">
              {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {showForm && (
          <div className="p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Título do Leilão *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Leilão de Imóveis"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Horário
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Empresa
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Ex: Sicoob Credicoopa"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Local
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Ex: Patos de Minas - MG"
                  className={inputClass}
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Logo da Empresa
                </label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handleEventLogoFile} className="hidden" id="event-logo" />
                  <label
                    htmlFor="event-logo"
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-yellow-400 text-xs text-gray-500 hover:text-yellow-600 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {form.logoUrl ? "Alterar logo" : "Upload da logo"}
                  </label>
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="Preview" className="h-10 w-20 object-contain rounded border border-gray-200 bg-white p-1" />
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.title || !form.date}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: editingId ? "#1d4ed8" : "#E8A020", color: editingId ? "#fff" : "#111" }}
            >
              {editingId
                ? <><Pencil className="w-4 h-4" /> Salvar Alterações</>
                : <><Plus   className="w-4 h-4" /> Adicionar ao Flyer</>}
            </button>
          </div>
        )}
      </div>

      {/* ── FILTRO POR EMPRESA ── */}
      {companies.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            Filtrar por empresa
            {filterCompany && (
              <button
                onClick={() => onFilterCompany(null)}
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors normal-case tracking-normal"
              >
                Limpar filtro ✕
              </button>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => {
              const active = filterCompany === company;
              return (
                <button
                  key={company}
                  onClick={() => onFilterCompany(active ? null : company)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    background: active ? "#C8860B" : "#fff",
                    color: active ? "#fff" : "#6b7280",
                    borderColor: active ? "#C8860B" : "#e5e7eb",
                    boxShadow: active ? "0 1px 6px #C8860B44" : "none",
                  }}
                >
                  {company}
                </button>
              );
            })}
          </div>
          {filterCompany && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
              O flyer está mostrando apenas os leilões de <strong>{filterCompany}</strong>.
            </p>
          )}
        </div>
      )}

      {/* ── LISTA DE EVENTOS ── */}
      {events.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Leilões cadastrados ({events.length})
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {events
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((ev) => {
                const expired = (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const [y, m, d] = ev.date.split("-").map(Number);
                  return new Date(y, m - 1, d) < today;
                })();
                const [y, m, d] = ev.date.split("-").map(Number);
                const fmtDate = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

                return (
                  <div
                    key={ev.id}
                    className={`rounded-xl border overflow-hidden ${expired ? "opacity-60" : ""}`}
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
                      {ev.logoUrl && (
                        <img src={ev.logoUrl} alt="" className="w-10 h-8 object-contain flex-shrink-0 rounded bg-white border border-gray-100 p-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-800">{ev.title}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {fmtDate}{ev.time && ` • ${ev.time}h`}{ev.location && ` • ${ev.location}`}
                        </p>
                        {expired && (
                          <span className="text-xs text-red-400 font-medium">Expirado — não aparece no flyer</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditing(ev)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveEvent(ev.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Botões de status */}
                    <div className="flex" style={{ borderTop: "1px solid #f3f4f6" }}>
                      {STATUS_OPTIONS.map((opt, i) => {
                        const active = ev.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => onChangeStatus(ev.id, opt.value)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold transition-all"
                            style={{
                              background: active ? opt.bg : "#fafafa",
                              color: active ? opt.color : "#9ca3af",
                              borderRight: i < STATUS_OPTIONS.length - 1 ? "1px solid #f3f4f6" : "none",
                            }}
                          >
                            <span style={{ color: active ? opt.color : "#d1d5db" }}>{opt.icon}</span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── BOTÕES DE EXPORTAÇÃO ── */}
      <div className="space-y-2 pt-1">
        {/* WhatsApp */}
        <button
          onClick={onWhatsAppShare}
          disabled={sharing}
          className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow text-sm disabled:opacity-60"
          style={{ background: "#25D366" }}
        >
          {sharing ? (
            <>
              <SpinIcon /> Gerando imagem…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Compartilhar Flyer no WhatsApp
            </>
          )}
        </button>

        {/* PDF + JPG lado a lado */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSavePDF}
            disabled={savingPDF}
            className="py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow text-sm border disabled:opacity-60"
            style={{ background: "#fff", color: "#B8780A", borderColor: "#E8A020" }}
          >
            {savingPDF ? <SpinIcon color="#B8780A" /> : <FileDown className="w-4 h-4" />}
            Salvar PDF
          </button>
          <button
            onClick={onSaveJPG}
            disabled={savingJPG}
            className="py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow text-sm border disabled:opacity-60"
            style={{ background: "#fff", color: "#1d4ed8", borderColor: "#93c5fd" }}
          >
            {savingJPG ? <SpinIcon color="#1d4ed8" /> : <ImageDown className="w-4 h-4" />}
            Salvar JPG
          </button>
        </div>
      </div>
    </div>
  );
}

function SpinIcon({ color = "#fff" }: { color?: string }) {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
