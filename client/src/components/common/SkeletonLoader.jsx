import classNames from "../../utils/classNames";

/**
 * Placeholder shapes shown while content loads. Uses the `.skeleton` classes
 * from components.css. The wrapper announces "Loading content" once to
 * screen readers; the shapes themselves are hidden from assistive tech.
 *
 * Props
 *  variant   "text"   paragraph lines                       (lines)
 *            "title"  a single heading bar
 *            "avatar" a circle                              (size)
 *            "block"  a plain rectangle                     (height)
 *            "card"   image + title + text (destination / trip cards)
 *            "stat"   dashboard statistic card
 *            "list"   rows of avatar + two text lines       (rows)
 *            "table"  table with header and body rows       (rows, columns)
 *  count     how many times to repeat the shape (default 1). Repeated items
 *            are laid out in a responsive grid for "card" and "stat",
 *            and stacked for everything else.
 *  lines     number of text lines for "text" (default 3)
 *  rows      number of rows for "list" and "table"
 *  columns   number of columns for "table" (default 4)
 *  size      avatar diameter in px (default 40)
 *  height    block height in px (default 120)
 *  className extra class for the wrapper
 *
 * Examples
 *  <SkeletonLoader variant="card" count={3} />
 *  <SkeletonLoader variant="table" rows={5} columns={5} />
 *  <SkeletonLoader variant="text" lines={4} />
 */

function TextLines({ lines = 3 }) {
  return (
    <>
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className="skeleton skeleton--text"
          style={{ width: index === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <div className="card">
      <span className="skeleton skeleton--image" />
      <div className="card__body">
        <span className="skeleton skeleton--title" />
        <TextLines lines={2} />
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="card">
      <div className="card__body">
        <span className="skeleton skeleton--text" style={{ width: "50%" }} />
        <span
          className="skeleton skeleton--title"
          style={{ width: "40%", height: 30, marginTop: 8 }}
        />
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="skeleton skeleton--circle" />
          <div style={{ flex: 1 }}>
            <span
              className="skeleton skeleton--text"
              style={{ width: "55%" }}
            />
            <span
              className="skeleton skeleton--text"
              style={{ width: "35%", marginBottom: 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4 }) {
  const columnList = Array.from({ length: columns }, (_, index) => index);

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columnList.map((column) => (
              <th key={column}>
                <span
                  className="skeleton skeleton--text"
                  style={{ width: "70%", marginBottom: 0 }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {columnList.map((column) => (
                <td key={column}>
                  <span
                    className="skeleton skeleton--text"
                    style={{ width: column === 0 ? "80%" : "60%", marginBottom: 0 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SkeletonLoader({
  variant = "text",
  count = 1,
  lines = 3,
  rows,
  columns = 4,
  size = 40,
  height = 120,
  className,
}) {
  const renderOne = (key) => {
    switch (variant) {
      case "title":
        return <span key={key} className="skeleton skeleton--title" />;
      case "avatar":
        return (
          <span
            key={key}
            className="skeleton skeleton--circle"
            style={{ width: size, height: size }}
          />
        );
      case "block":
        return (
          <span key={key} className="skeleton skeleton--block" style={{ height }} />
        );
      case "card":
        return <CardSkeleton key={key} />;
      case "stat":
        return <StatSkeleton key={key} />;
      case "list":
        return <ListSkeleton key={key} rows={rows} />;
      case "table":
        return <TableSkeleton key={key} rows={rows} columns={columns} />;
      case "text":
      default:
        return <TextLines key={key} lines={lines} />;
    }
  };

  const items = Array.from({ length: count }, (_, index) => renderOne(index));
  const isGridVariant = variant === "card" || variant === "stat";

  return (
    <div
      className={classNames(
        isGridVariant && "grid grid--3",
        variant === "stat" && "grid--4",
        className
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading content</span>
      {items}
    </div>
  );
}