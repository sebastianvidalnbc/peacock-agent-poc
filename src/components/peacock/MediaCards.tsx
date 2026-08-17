import { useEffect, useRef, useState } from "react";
import type {
  CatalogTitle,
  PlaybackDestination,
  PreviewInfo,
} from "../../peacock/types";
import { CardShell } from "./CardShell";

function TitleRow({ t }: { t: CatalogTitle }) {
  return (
    <div className="title-row">
      <div className="title-row-main">
        <div className="title-row-name">{t.title}</div>
        <div className="meta">
          {t.type === "series" ? "Series" : "Film"} · {t.year} · {t.rating}
          {t.downloadable ? " · downloadable" : ""}
        </div>
      </div>
      <div className="chips">
        {t.genres.slice(0, 2).map((g) => (
          <span className="chip" key={g}>
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}

export function WatchlistCard({ titles }: { titles: CatalogTitle[] }) {
  return (
    <CardShell title="Your watchlist">
      {titles.length === 0 ? (
        <p className="meta">Nothing here yet. Ask me to add a title.</p>
      ) : (
        titles.map((t) => <TitleRow key={t.contentId} t={t} />)
      )}
    </CardShell>
  );
}

export function SearchCard({ titles }: { titles: CatalogTitle[] }) {
  return (
    <CardShell title="Search results">
      {titles.length === 0 ? (
        <p className="meta">No matching titles in the demo catalog.</p>
      ) : (
        titles.map((t) => <TitleRow key={t.contentId} t={t} />)
      )}
    </CardShell>
  );
}

export function TitleCard({ title }: { title: CatalogTitle }) {
  return (
    <CardShell title={title.title}>
      <p className="meta">
        {title.type === "series" ? "Series" : "Film"} · {title.year} · {title.rating}
      </p>
      <p className="synopsis">{title.synopsis}</p>
      <div className="chips">
        {title.genres.map((g) => (
          <span className="chip" key={g}>
            {g}
          </span>
        ))}
      </div>
    </CardShell>
  );
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

/**
 * A simulated, prototype-safe preview player. It never streams a real asset —
 * it renders a poster derived from the title and animates a timeline over the
 * preview's mock duration so the discovery flow feels tangible.
 */
export function PreviewPlayer({ title, preview }: { title: CatalogTitle; preview: PreviewInfo }) {
  const duration = Math.max(1, preview.durationSeconds);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setElapsed((e) => {
        const next = e + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [playing, duration]);

  function toggle() {
    if (!playing && elapsed >= duration) setElapsed(0);
    setPlaying((p) => !p);
  }

  const pct = Math.min(100, (elapsed / duration) * 100);
  const label = preview.previewType === "trailer" ? "Trailer" : "Preview";

  return (
    <div className="preview-player">
      <div className="preview-stage" data-artwork={title.artworkRef ?? ""}>
        <span className="preview-poster-title">{title.title}</span>
        <span className="preview-badge">{label} · simulated</span>
      </div>
      <div className="preview-controls">
        <button
          type="button"
          className="preview-play"
          onClick={toggle}
          aria-label={playing ? `Pause ${label.toLowerCase()} of ${title.title}` : `Play ${label.toLowerCase()} of ${title.title}`}
          aria-pressed={playing}
        >
          {playing ? "❚❚" : "►"}
        </button>
        <div
          className="preview-timeline"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.floor(elapsed)}
        >
          <span className="preview-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="preview-time">
          {formatTime(elapsed)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

/**
 * A content-discovery offer for a title: availability, synopsis, and (when the
 * user has opted in) an inline simulated preview player. Action buttons live in
 * the message action row; `previewOpen` reflects whether preview was requested.
 */
export function TitleOfferCard({
  title,
  preview,
  previewOpen,
}: {
  title: CatalogTitle;
  preview?: PreviewInfo;
  previewOpen: boolean;
}) {
  return (
    <CardShell title={title.title}>
      <div className="chips">
        <span className="chip on-peacock">On Peacock</span>
        {title.genres.slice(0, 2).map((g) => (
          <span className="chip" key={g}>
            {g}
          </span>
        ))}
      </div>
      <p className="meta">
        {title.type === "series" ? "Series" : "Film"} · {title.year} · {title.rating}
      </p>
      <p className="synopsis">{title.synopsis}</p>
      {previewOpen && preview?.previewAvailable && (
        <PreviewPlayer title={title} preview={preview} />
      )}
    </CardShell>
  );
}

/** A confirmed Peacock playback handoff for a title (simulated deep link). */
export function HandoffCard({
  title,
  destination,
}: {
  title: CatalogTitle;
  destination: PlaybackDestination;
}) {
  return (
    <CardShell title={`Opening ${title.title}`}>
      <p>Handing off to {destination.destination} to start playback.</p>
      <p className="meta">Simulated destination: {destination.destinationUrl}</p>
    </CardShell>
  );
}

export function ConnectCard() {
  return (
    <CardShell title="Connect Peacock">
      <p className="meta">
        This is a simulated connection to Peacock — no username, password, MFA, or payment
        details are ever requested.
      </p>
    </CardShell>
  );
}
