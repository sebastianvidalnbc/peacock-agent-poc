import type { CatalogTitle } from "../../peacock/types";
import { CardShell } from "./CardShell";

function TitleRow({ t }: { t: CatalogTitle }) {
  return (
    <div className="title-row">
      <div>
        <div>{t.title}</div>
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
      <div className="chips">
        {title.genres.map((g) => (
          <span className="chip" key={g}>
            {g}
          </span>
        ))}
      </div>
      <p style={{ margin: "6px 0 0" }}>{title.synopsis}</p>
      <p className="meta">
        {title.type === "series" ? "Series" : "Film"} · {title.year} · {title.rating}
      </p>
    </CardShell>
  );
}

export function ConnectCard() {
  return (
    <CardShell title="Connect Peacock">
      <p className="meta" style={{ margin: 0 }}>
        This is a simulated connection to Peacock — no username, password, MFA, or payment
        details are ever requested.
      </p>
    </CardShell>
  );
}
