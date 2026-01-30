"use client";
import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, User, Filter } from "lucide-react";

const ENDPOINTS = {
  LAHAN: "https://script.google.com/macros/s/AKfycbxdEtC-SVJCvh1VBzOm9s1LY01CbLUbTEh562jBUijo0RwVT9teORtB9qOKpRXs4VM/exec?sheet=LAHAN",
  KEGIATAN: "https://script.google.com/macros/s/AKfycbxdEtC-SVJCvh1VBzOm9s1LY01CbLUbTEh562jBUijo0RwVT9teORtB9qOKpRXs4VM/exec?sheet=KEGIATAN",
  USERS: "https://script.google.com/macros/s/AKfycbxdEtC-SVJCvh1VBzOm9s1LY01CbLUbTEh562jBUijo0RwVT9teORtB9qOKpRXs4VM/exec?sheet=USERS",
  SCHEDULES: "https://script.google.com/macros/s/AKfycbxdEtC-SVJCvh1VBzOm9s1LY01CbLUbTEh562jBUijo0RwVT9teORtB9qOKpRXs4VM/exec?sheet=SCHEDULES"
};

function toLocalDate(dateStr) {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateKeyLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(d) {
  return d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatShortDate(d) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });
}

function timeFromExcelDate(dateStr) {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isNumericString(v) {
  return /^[0-9]+$/.test(String(v || "").trim());
}

function statusClass(s) {
  if (!s) return "badge-planned";
  const k = s.toLowerCase();
  if (k === "planned") return "badge-planned";
  if (k === "ongoing") return "badge-ongoing";
  if (k === "completed") return "badge-completed";
  if (k === "cancelled") return "badge-cancelled";
  return "badge-planned";
}

function statusLabel(s) {
  if (!s) return "Planned";
  const k = s.toLowerCase();
  if (k === "planned") return "Planned";
  if (k === "ongoing") return "Ongoing";
  if (k === "completed") return "Completed";
  if (k === "cancelled") return "Cancelled";
  return "Planned";
}

function statusBgClass(s) {
  if (!s) return "bg-white";
  const k = s.toLowerCase();
  if (k === "planned") return "bg-blue-50";
  if (k === "ongoing") return "bg-yellow-50";
  if (k === "completed") return "bg-green-50";
  if (k === "cancelled") return "bg-red-50";
  return "bg-white";
}

function statusBorderClass(s, isToday) {
  if (isToday) return "border-blue-500";
  if (!s) return "border-gray-200";
  const k = s.toLowerCase();
  if (k === "planned") return "border-blue-300";
  if (k === "ongoing") return "border-yellow-300";
  if (k === "completed") return "border-green-300";
  if (k === "cancelled") return "border-red-300";
  return "border-gray-200";
}

// mobile uses same calendar grid; no left border indicator needed

function includeByKegiatanOrCompleted(it) {
  const id = Number(it.kegiatan_id) || 0;
  const s = (it.status || "").toLowerCase();
  return (id >= 1 && id <= 21) || s === "completed";
}

function StatusLegend() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="flex items-center gap-2"><span className="badge badge-planned">Planned</span><span className="text-sm text-gray-600">Direncanakan</span></div>
      <div className="flex items-center gap-2"><span className="badge badge-ongoing">Ongoing</span><span className="text-sm text-gray-600">Berlangsung</span></div>
      <div className="flex items-center gap-2"><span className="badge badge-completed">Completed</span><span className="text-sm text-gray-600">Selesai</span></div>
      <div className="flex items-center gap-2"><span className="badge badge-cancelled">Cancelled</span><span className="text-sm text-gray-600">Dibatalkan</span></div>
    </div>
  );
}

export default function Page() {
  const today = useMemo(() => toLocalDate(new Date()), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonthDate = useMemo(() => {
    const base = new Date(today);
    base.setMonth(base.getMonth() + monthOffset);
    base.setDate(1);
    return base;
  }, [today, monthOffset]);
  const [lahan, setLahan] = useState([]);
  const [kegiatan, setKegiatan] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedLahan, setSelectedLahan] = useState("");
  const [selectedKegiatan, setSelectedKegiatan] = useState("");
  const [modalDate, setModalDate] = useState(null);

  useEffect(() => {
    async function loadAll() {
      const [lRes, kRes, uRes, sRes] = await Promise.all([
        fetch(ENDPOINTS.LAHAN).then(r => r.json()),
        fetch(ENDPOINTS.KEGIATAN).then(r => r.json()),
        fetch(ENDPOINTS.USERS).then(r => r.json()),
        fetch(ENDPOINTS.SCHEDULES).then(r => r.json())
      ]);
      setLahan(lRes || []);
      setKegiatan(kRes || []);
      setUsers(uRes || []);
      const normalized = (sRes || []).map(it => ({
        ...it,
        tanggal: toLocalDate(it.tanggal),
        waktu_mulai_str: timeFromExcelDate(it.waktu_mulai),
        waktu_selesai_str: timeFromExcelDate(it.waktu_selesai)
      }));
      setSchedules(normalized);
    }
    loadAll();
  }, []);

  const lahanMap = useMemo(() => {
    const m = new Map();
    for (const l of lahan) m.set(l.lahan_id, l);
    return m;
  }, [lahan]);
  const kegiatanMap = useMemo(() => {
    const m = new Map();
    for (const k of kegiatan) m.set(k.kegiatan_id, k);
    return m;
  }, [kegiatan]);
  const usersMap = useMemo(() => {
    const m = new Map();
    for (const u of users) m.set(u.user_id, u);
    return m;
  }, [users]);

  const filteredSchedules = useMemo(() => {
    const lahanQuery = String(selectedLahan || "").toLowerCase();
    const kegiatanQuery = String(selectedKegiatan || "").toLowerCase();
    return schedules.filter(s => {
      const okLahan = lahanQuery
        ? ((lahanMap.get(s.lahan_id)?.nama_lahan || "").toLowerCase().includes(lahanQuery))
        : true;
      const okKeg = kegiatanQuery
        ? ((kegiatanMap.get(s.kegiatan_id)?.nama_kegiatan || "").toLowerCase().includes(kegiatanQuery))
        : true;
      return okLahan && okKeg;
    });
  }, [schedules, selectedLahan, selectedKegiatan, lahanMap, kegiatanMap]);

  const monthDays = useMemo(() => {
    const start = new Date(currentMonthDate);
    const startDay = start.getDay();
    const days = [];
    const firstGridDate = new Date(start);
    firstGridDate.setDate(1 - ((startDay + 6) % 7));
    for (let i = 0; i < 42; i++) {
      const d = new Date(firstGridDate);
      d.setDate(firstGridDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentMonthDate]);

  const scheduleByDay = useMemo(() => {
    const m = new Map();
    for (const s of filteredSchedules) {
      const key = dateKeyLocal(s.tanggal);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(s);
    }
    return m;
  }, [filteredSchedules]);

  function openModalForDate(d) {
    const inCurrentMonth = d.getMonth() === currentMonthDate.getMonth();
    const key = dateKeyLocal(d);
    const items = scheduleByDay.get(key) || [];
    if (inCurrentMonth && items.length) setModalDate(d);
  }

  function closeModal() {
    setModalDate(null);
  }

  function formatMonthTitle(d) {
    return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="card bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-green-600 p-2 text-white">
              <Calendar size={20} />
            </div>
            <h1 className="text-lg font-bold sm:text-xl">Jadwal Kegiatan Pertanian UBIPRENEUR</h1>
          </div>
          <button className="btn btn-outline sm:hidden">
            <Filter size={16} />
            Filter
          </button>
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Filter Lahan</label>
              <input
                list="lahanList"
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                placeholder="Ketik nama atau pilih lahan"
                value={selectedLahan}
                onChange={e => setSelectedLahan(e.target.value)}
              />
              <datalist id="lahanList">
                <option value=""></option>
                {lahan.map(l => (
                  <option key={l.lahan_id} value={l.nama_lahan}>{l.nama_lahan}</option>
                ))}
              </datalist>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Filter Kegiatan</label>
              <input
                list="kegiatanList"
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                placeholder="Ketik nama atau pilih kegiatan"
                value={selectedKegiatan}
                onChange={e => setSelectedKegiatan(e.target.value)}
              />
              <datalist id="kegiatanList">
                <option value=""></option>
                {kegiatan.map(k => (
                  <option key={k.kegiatan_id} value={k.nama_kegiatan}>{k.nama_kegiatan}</option>
                ))}
              </datalist>
            </div>
            <div className="flex items-end">
              <button
                className="btn btn-outline w-full"
                onClick={() => {
                  setSelectedLahan("");
                  setSelectedKegiatan("");
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <button className="btn btn-outline btn-icon" onClick={() => setMonthOffset(m => m - 1)}>
                <ChevronLeft />
              </button>
              <div className="text-lg font-semibold">{formatMonthTitle(currentMonthDate)}</div>
              <button className="btn btn-outline btn-icon" onClick={() => setMonthOffset(m => m + 1)}>
                <ChevronRight />
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm text-gray-600">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(d => (
                    <div key={d} className="py-2 font-medium">{d}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
                  {monthDays.map((d, idx) => {
                    const inCurrentMonth = d.getMonth() === currentMonthDate.getMonth();
                    const isToday = d.toDateString() === today.toDateString();
                    const key = dateKeyLocal(d);
                    const items = scheduleByDay.get(key) || [];
                    const primary = items[0];
                    const primaryStatus = primary?.status || "";
                    return (
                      <button
                        key={idx}
                        onClick={() => openModalForDate(d)}
                        className={[
                          "rounded-lg border p-2 sm:p-2 text-left transition hover:scale-[1.02] hover:shadow-sm",
                          inCurrentMonth ? statusBgClass(primaryStatus) : "bg-gray-50 text-gray-400",
                          statusBorderClass(primaryStatus, isToday)
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm sm:text-base font-semibold">{d.getDate()}</span>
                          {primary && (
                            <span className={`badge ${statusClass(primaryStatus)} hidden sm:inline-flex`}>{statusLabel(primaryStatus)}</span>
                          )}
                        </div>
                        {primary && (
                          <div className="mt-1 sm:mt-2 text-xs sm:text-xs font-semibold text-gray-800">
                            <span className="block truncate">{(lahanMap.get(primary.lahan_id)?.nama_lahan || "Lahan")}</span>
                            <span className="hidden sm:inline">
                              {" - "}{(kegiatanMap.get(primary.kegiatan_id)?.nama_kegiatan || "Kegiatan")}
                            </span>
                            {items.length > 1 && (
                              <span className="ml-2 hidden sm:inline text-[11px] text-gray-500">+{items.length - 1}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <StatusLegend />
            <div className="mt-6">
              <div className="space-y-3">
                {monthDays.map((d, idx) => {
                  if (d.getMonth() !== currentMonthDate.getMonth()) return null;
                  const key = dateKeyLocal(d);
                  const items = (scheduleByDay.get(key) || [])
                    .filter(includeByKegiatanOrCompleted)
                    .sort((a, b) => {
                      const ai = Number(a.kegiatan_id) || 0;
                      const bi = Number(b.kegiatan_id) || 0;
                      return ai - bi;
                    });
                  if (!items.length) return null;
                  return (
                    <div key={`list-${idx}`} className="card p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold">{d.toLocaleDateString("id-ID", { day: "2-digit", month: "long" })}</div>
                        <div className="text-xs text-gray-500">{items.length} kegiatan</div>
                      </div>
                      <div className="space-y-1">
                        {items.map(it => {
                          const l = lahanMap.get(it.lahan_id);
                          const k = kegiatanMap.get(it.kegiatan_id);
                          return (
                            <div key={`detail-${key}-${it.id_schedules}`} className="flex items-center justify-between text-sm">
                              <div className="truncate">{(l?.nama_lahan || "Lahan")}{" - "}{(k?.nama_kegiatan || "Kegiatan")}</div>
                              <span className={`badge ${statusClass(it.status)}`}>{statusLabel(it.status)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {modalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="card max-w-2xl w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold">{formatDateLong(modalDate)}</div>
              <button className="btn btn-outline" onClick={closeModal}>Tutup</button>
            </div>
            <div className="space-y-3">
              {(scheduleByDay.get(dateKeyLocal(modalDate)) || []).map(it => {
                const l = lahanMap.get(it.lahan_id);
                const k = kegiatanMap.get(it.kegiatan_id);
                const u = usersMap.get(it.user_id);
                return (
                  <div key={it.id_schedules} className="card p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{k?.nama_kegiatan || "Kegiatan"}</div>
                      <span className={`badge ${statusClass(it.status)}`}>{it.status}</span>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={16} className="text-gray-500" />
                        <span>{l?.nama_lahan || "Lahan"}{l?.lokasi ? ` • ${l.lokasi}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={16} className="text-gray-500" />
                        <span>{it.waktu_mulai_str} - {it.waktu_selesai_str}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={16} className="text-gray-500" />
                        <span>{u?.full_name || "Petugas"}</span>
                      </div>
                    </div>
                    {it.catatan && (
                      <div className="mt-2 text-sm text-gray-600">
                        {it.catatan}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
