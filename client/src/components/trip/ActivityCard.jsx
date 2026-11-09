import { FiClock, FiMessageSquare } from "react-icons/fi";

import Badge from "../ui/Badge";
import { INTERESTS } from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";

const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);

function formatDuration(hours) {
  if (!hours) return "";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/**
 * One activity inside a day: name, type, duration, estimated cost and notes.
 *
 * Props
 *  item     { name, category, durationHours, costPerPerson, notes }
 *  units    paying travellers (adults + children at the child rate), from
 *           getPayingUnits(trip). Used to show the cost for the whole group
 *  actions  optional React node for buttons (the editor adds Edit / Remove)
 */
export default function ActivityCard({ item, units = 1, actions }) {
  const isFree = !item.costPerPerson;
  const groupCost = Math.round(item.costPerPerson * units);
  const duration = formatDuration(item.durationHours);

  return (
    <div className="activity">
      <div className="activity__main">
        <p className="activity__name">{item.name}</p>

        <div className="activity__meta">
          <Badge variant="primary">
            {INTEREST_LABELS[item.category] || item.category}
          </Badge>
          {duration && (
            <span className="activity__duration">
              <FiClock size={14} aria-hidden="true" />
              {duration}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="activity__notes">
            <FiMessageSquare size={14} aria-hidden="true" />
            {item.notes}
          </p>
        )}
      </div>

      <div className="activity__cost">
        <span className="activity__price">
          {isFree ? "Free" : formatCurrency(groupCost)}
        </span>
        {!isFree && units !== 1 && (
          <span className="activity__unit">
            {formatCurrency(item.costPerPerson)} per person
          </span>
        )}
      </div>

      {actions && <div className="activity__actions">{actions}</div>}
    </div>
  );
}