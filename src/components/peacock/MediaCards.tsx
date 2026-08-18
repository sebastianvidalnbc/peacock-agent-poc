import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  CatalogTitle,
  NextEpisode,
  PlaybackDestination,
  PreviewInfo,
  ViewingProgress,
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

/**
 * Wrap multi-item rows in a horizontal scroll-snap carousel; a single item
 * renders as-is. Keeps every row's data and actions intact — layout only.
 */
function ItemRail({ count, children }: { count: number; children: ReactNode }) {
  return <div className={count > 1 ? "carousel" : undefined}>{children}</div>;
}

export function WatchlistCard({ titles }: { titles: CatalogTitle[] }) {
  return (
    <CardShell title="Your watchlist">
      {titles.length === 0 ? (
        <p className="meta">Nothing here yet. Ask me to add a title.</p>
      ) : (
        <ItemRail count={titles.length}>
          {titles.map((t) => <TitleRow key={t.contentId} t={t} />)}
        </ItemRail>
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
        <ItemRail count={titles.length}>
          {titles.map((t) => <TitleRow key={t.contentId} t={t} />)}
        </ItemRail>
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

/** One in-progress row: title, optional episode tag, progress bar, time left. */
function ProgressRow({ v }: { v: ViewingProgress }) {
  const pct = v.durationSeconds > 0
    ? Math.min(100, Math.round((v.progressSeconds / v.durationSeconds) * 100))
    : 0;
  const remaining = Math.max(0, v.durationSeconds - v.progressSeconds);
  const ep =
    v.seasonNumber != null && v.episodeNumber != null
      ? ` · S${v.seasonNumber} E${v.episodeNumber}`
      : "";
  return (
    <div className="cw-row">
      <div className="cw-row-head">
        <span className="cw-title">{v.title}</span>
        <span className="meta">
          {v.completed ? "Finished" : `${formatTime(remaining)} left`}
        </span>
      </div>
      {(v.episodeTitle || ep) && (
        <div className="meta">
          {ep.replace(/^ · /, "")}
          {v.episodeTitle ? `${ep ? " · " : ""}"${v.episodeTitle}"` : ""}
        </div>
      )}
      <div
        className="preview-timeline cw-bar"
        role="progressbar"
        aria-label={`${v.title} watched`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span className="preview-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Continue Watching artifact: one or more in-progress titles with a resume
 * position, plus an optional "next episode" line. Read-only view of simulated
 * viewing state — the Resume action lives in the message action row.
 */
export function ContinueWatchingCard({
  items,
  nextEpisode,
}: {
  items: ViewingProgress[];
  nextEpisode?: NextEpisode;
}) {
  return (
    <CardShell title="Continue Watching">
      {items.length === 0 ? (
        <p className="meta">Nothing in progress right now.</p>
      ) : (
        <ItemRail count={items.length}>
          {items.map((v) => <ProgressRow key={v.contentId} v={v} />)}
        </ItemRail>
      )}
      {nextEpisode?.hasNext && (
        <p className="meta cw-next">
          Next up: S{nextEpisode.seasonNumber} E{nextEpisode.episodeNumber} · "{nextEpisode.episodeTitle}"
        </p>
      )}
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
