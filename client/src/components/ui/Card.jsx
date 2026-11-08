import classNames from "../../utils/classNames";

/**
 * Reusable card container.
 *
 * Props
 *  as         element or component to render (default "div"); use "article"
 *             or "section" for better semantics
 *  title      heading text shown in the card header
 *  headingLevel  "h2" | "h3" | "h4" ... for the title element (default "h3")
 *  actions    React node shown on the right of the header (buttons, badges)
 *  media      React node rendered above the content (usually an <img>)
 *  footer     React node rendered in the footer area
 *  hover      lift-on-hover effect (use for clickable cards)
 *  flat       removes the shadow
 *  padded     wraps children in the padded body (default true). Set to false
 *             for content that must touch the edges, such as a table.
 *  className  extra class for the card itself
 *  bodyClassName  extra class for the body wrapper
 *
 * Examples
 *  <Card title="Budget breakdown" actions={<Badge>Sample</Badge>}>...</Card>
 *  <Card as="article" hover media={<img src={url} alt="Pokhara" />}>...</Card>
 *  <Card title="Users" padded={false}><DataTable ... /></Card>
 */
export default function Card({
  as: Component = "div",
  title,
  headingLevel: Heading = "h3",
  actions,
  media,
  footer,
  hover = false,
  flat = false,
  padded = true,
  className,
  bodyClassName,
  children,
  ...rest
}) {
  const hasHeader = Boolean(title || actions);

  return (
    <Component
      className={classNames(
        "card",
        hover && "card--hover",
        flat && "card--flat",
        className
      )}
      {...rest}
    >
      {media && <div className="card__media">{media}</div>}

      {hasHeader && (
        <div className="card__header">
          {title ? <Heading className="card__title">{title}</Heading> : <span />}
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}

      {padded ? (
        <div className={classNames("card__body", bodyClassName)}>
          {children}
        </div>
      ) : (
        children
      )}

      {footer && <div className="card__footer">{footer}</div>}
    </Component>
  );
}