import { useState } from "react";
import { FiArrowDown, FiArrowUp, FiSearch } from "react-icons/fi";

import EmptyState from "../common/EmptyState";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Pagination from "../ui/Pagination";
import Select from "../ui/Select";
import classNames from "../../utils/classNames";

function compareValues(a, b) {
  const isEmpty = (value) => value === null || value === undefined || value === "";

  if (isEmpty(a) && isEmpty(b)) return 0;
  if (isEmpty(a)) return -1;
  if (isEmpty(b)) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Reusable data table with search, filters, sorting and pagination.
 *
 * Props
 *  caption           accessible name of the table
 *  columns           [{ key, label, render?(row), sortable?, sortValue?(row),
 *                       rowHeader?, hideLabel?, className? }]
 *                      render      custom cell content (default: row[key])
 *                      sortable    header becomes a sort button
 *                      sortValue   value used for sorting (default: row[key])
 *                      rowHeader   marks the column that names the row
 *                                  (rendered as a row header, for screen readers)
 *                      hideLabel   no label on the phone card layout (actions)
 *  rows              array of row objects
 *  getRowId          function(row) -> unique key (default: row.id)
 *  getSearchText     function(row) -> text the search box matches against
 *  searchLabel, searchPlaceholder
 *  filters           [{ id, label, options: [{ value, label }], match(row, value) }]
 *  initialSort       { key, direction: "asc" | "desc" }
 *  pageSize          rows per page (default 8)
 *  itemLabel         plural noun for the pagination summary
 *  emptyState        EmptyState props shown when `rows` is empty
 *
 * On phones (≤ 640px) the header row is hidden, every row becomes a stacked
 * card with labelled values, and a "Sort by" drop-down replaces the header
 * buttons.
 */
export default function DataTable({
  caption,
  columns,
  rows,
  getRowId = (row) => row.id,
  getSearchText,
  searchLabel = "Search",
  searchPlaceholder = "Search",
  filters = [],
  initialSort = null,
  pageSize = 8,
  itemLabel = "items",
  emptyState = { title: "Nothing here yet" },
}) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  if (rows.length === 0) return <EmptyState {...emptyState} />;

  // ---------- Filter, sort, page ----------
  const text = query.trim().toLowerCase();

  const filtered = rows.filter((row) => {
    if (text && !(getSearchText ? getSearchText(row) : "").toLowerCase().includes(text)) {
      return false;
    }
    return filters.every((filter) => {
      const value = filterValues[filter.id];
      return !value || filter.match(row, value);
    });
  });

  const sortColumn = sort ? columns.find((column) => column.key === sort.key) : null;
  const sorted = sortColumn
    ? [...filtered].sort((a, b) => {
        const getValue = sortColumn.sortValue || ((row) => row[sortColumn.key]);
        return compareValues(getValue(a), getValue(b)) * (sort.direction === "asc" ? 1 : -1);
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasActiveFilters = Boolean(text) || Object.values(filterValues).some(Boolean);

  // ---------- Actions ----------
  const handleSort = (key) => {
    setSort((previous) =>
      previous && previous.key === key
        ? { key, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setPage(1);
  };

  const handleMobileSort = (event) => {
    const [key, direction] = event.target.value.split(":");
    setSort({ key, direction });
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setFilterValues({});
    setPage(1);
  };

  const sortOptions = columns
    .filter((column) => column.sortable)
    .flatMap((column) => [
      { value: `${column.key}:asc`, label: `${column.label} (ascending)` },
      { value: `${column.key}:desc`, label: `${column.label} (descending)` },
    ]);

  const getAriaSort = (column) => {
    if (!column.sortable) return undefined;
    if (!sort || sort.key !== column.key) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  };

  return (
    <div className="datatable">
      <div className="datatable__toolbar">
        <Input
          className="datatable__search"
          label={searchLabel}
          name="tableSearch"
          type="search"
          leftIcon={<FiSearch size={18} />}
          placeholder={searchPlaceholder}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />

        {filters.map((filter) => (
          <Select
            key={filter.id}
            className="datatable__filter"
            label={filter.label}
            name={`filter-${filter.id}`}
            options={[{ value: "", label: "All" }, ...filter.options]}
            value={filterValues[filter.id] || ""}
            onChange={(event) => {
              setFilterValues((previous) => ({ ...previous, [filter.id]: event.target.value }));
              setPage(1);
            }}
          />
        ))}

        {sortOptions.length > 0 && (
          <Select
            className="datatable__sort-select"
            label="Sort by"
            name="tableSort"
            placeholder="Default order"
            options={sortOptions}
            value={sort ? `${sort.key}:${sort.direction}` : ""}
            onChange={handleMobileSort}
          />
        )}

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {sorted.length} {itemLabel} shown
      </p>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<FiSearch />}
          title="No results"
          message="Nothing matches your search or filters."
          actionLabel="Clear search and filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr>
                  {columns.map((column) => {
                    const isSorted = sort && sort.key === column.key;

                    return (
                      <th key={column.key} scope="col" aria-sort={getAriaSort(column)}>
                        {column.sortable ? (
                          <button
                            type="button"
                            className={classNames("datatable__sort", isSorted && "is-sorted")}
                            onClick={() => handleSort(column.key)}
                          >
                            {column.label}
                            <span className="datatable__sort-icon" aria-hidden="true">
                              {isSorted && sort.direction === "desc" ? (
                                <FiArrowDown size={14} />
                              ) : (
                                <FiArrowUp size={14} />
                              )}
                            </span>
                          </button>
                        ) : column.hideLabel ? (
                          <span className="sr-only">{column.label}</span>
                        ) : (
                          column.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {visible.map((row) => (
                  <tr key={getRowId(row)}>
                    {columns.map((column) => {
                      const content = column.render ? column.render(row) : row[column.key];
                      const label = column.hideLabel ? "" : column.label;

                      return column.rowHeader ? (
                        <th
                          key={column.key}
                          scope="row"
                          className={classNames("datatable__rowhead", column.className)}
                        >
                          {content}
                        </th>
                      ) : (
                        <td key={column.key} data-label={label} className={column.className}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safePage}
            totalItems={sorted.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel={itemLabel}
          />
        </>
      )}
    </div>
  );
}