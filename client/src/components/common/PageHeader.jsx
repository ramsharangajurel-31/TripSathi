import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import classNames from "../../utils/classNames";

/**
 * Title row shown at the top of dashboard and admin pages.
 *
 * Props
 *  title        page heading (rendered as the page's <h1>)
 *  subtitle     one-line description under the title
 *  breadcrumbs  array of { label, to }. The last item is the current page
 *               and needs no `to`.
 *  actions      React node on the right (buttons); stacks full width on mobile
 *  className    extra class
 *
 * Example
 *  <PageHeader
 *    title="Saved trips"
 *    subtitle="Itineraries you have saved for later."
 *    breadcrumbs={[
 *      { label: "Dashboard", to: "/dashboard" },
 *      { label: "Saved trips" },
 *    ]}
 *    actions={<Button to="/dashboard/create-trip" leftIcon={<FiPlus />}>New trip</Button>}
 *  />
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className,
}) {
  return (
    <header className={classNames("page-header", className)}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumbs">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <li
                    key={`${crumb.label}-${index}`}
                    className="flex items-center gap-2"
                  >
                    {crumb.to && !isLast ? (
                      <Link to={crumb.to}>{crumb.label}</Link>
                    ) : (
                      <span aria-current={isLast ? "page" : undefined}>
                        {crumb.label}
                      </span>
                    )}
                    {!isLast && (
                      <FiChevronRight size={12} aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}