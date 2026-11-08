import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import classNames from "../../utils/classNames";

const ELLIPSIS = "ellipsis";

/**
 * Builds the list of page items to display, e.g. [1, "ellipsis", 4, 5, 6, "ellipsis", 20].
 * Always shows the first page, last page, the current page and its siblings.
 */
function getPageItems(currentPage, totalPages, siblingCount) {
  // first + last + current + 2 ellipsis slots + siblings on both sides
  const maxVisible = siblingCount * 2 + 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, index) => start + index);

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + siblingCount * 2;
    return [...range(1, leftCount), ELLIPSIS, totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + siblingCount * 2;
    return [1, ELLIPSIS, ...range(totalPages - rightCount + 1, totalPages)];
  }

  return [
    1,
    ELLIPSIS,
    ...range(leftSibling, rightSibling),
    ELLIPSIS,
    totalPages,
  ];
}

/**
 * Pagination controls with a "Showing X–Y of Z" summary.
 * The component is stateless: the parent owns `currentPage`.
 *
 * Props
 *  currentPage    1-based current page
 *  totalItems     total number of items across all pages
 *  pageSize       items per page (default 10)
 *  onPageChange   function(newPage)
 *  siblingCount   page buttons shown on each side of the current page (default 1)
 *  itemLabel      plural noun for the summary text (default "results")
 *  className      extra class
 *
 * Example
 *  const [page, setPage] = useState(1);
 *  const pageItems = users.slice((page - 1) * 10, page * 10);
 *  <Pagination currentPage={page} totalItems={users.length}
 *              pageSize={10} onPageChange={setPage} itemLabel="users" />
 */
export default function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  siblingCount = 1,
  itemLabel = "results",
  className,
}) {
  if (!totalItems || totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const firstItem = (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);

  const goTo = (page) => {
    if (page < 1 || page > totalPages || page === safePage) return;
    onPageChange(page);
  };

  const pageItems = getPageItems(safePage, totalPages, siblingCount);

  return (
    <nav
      className={classNames("pagination", className)}
      aria-label="Pagination"
    >
      <p className="pagination__info" aria-live="polite">
        Showing {firstItem}–{lastItem} of {totalItems} {itemLabel}
      </p>

      {totalPages > 1 && (
        <ul className="pagination__list">
          <li>
            <button
              type="button"
              className="pagination__btn"
              onClick={() => goTo(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Go to previous page"
            >
              <FiChevronLeft aria-hidden="true" />
              <span>Prev</span>
            </button>
          </li>

          {pageItems.map((item, index) =>
            item === ELLIPSIS ? (
              <li
                key={`ellipsis-${index}`}
                className="pagination__ellipsis pagination__btn--page"
                aria-hidden="true"
              >
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={classNames(
                    "pagination__btn",
                    "pagination__btn--page",
                    item === safePage && "is-active"
                  )}
                  onClick={() => goTo(item)}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === safePage ? "page" : undefined}
                >
                  {item}
                </button>
              </li>
            )
          )}

          <li>
            <button
              type="button"
              className="pagination__btn"
              onClick={() => goTo(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Go to next page"
            >
              <span>Next</span>
              <FiChevronRight aria-hidden="true" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}