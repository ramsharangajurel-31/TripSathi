import { FiEdit2 } from "react-icons/fi";

import Modal from "../common/Modal";
import SafeImage from "../common/SafeImage";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { BUDGET_TIERS, INTERESTS } from "../../data/destinations";
import { COST_FIELDS } from "../../utils/adminValidation";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatTravelTime } from "../../utils/routeUtils";

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };
const INTEREST_LABELS = Object.fromEntries(INTERESTS.map((item) => [item.id, item.label]));

function Row({ label, children }) {
  return (
    <div className="info-list__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Read-only view of one destination.
 * Props: destination, counts { attractions, activities }, onEdit(), onClose()
 */
export default function DestinationDetailsModal({ destination, counts, onEdit, onClose }) {
  const access = destination.fromKathmandu || {};

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={destination.name}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button leftIcon={<FiEdit2 />} onClick={onEdit}>
            Edit
          </Button>
        </>
      }
    >
      <div className="detail-hero">
        <SafeImage src={destination.image} alt={`${destination.name}, Nepal`} fallbackLabel={destination.name} />
      </div>

      <div className="review-tags" style={{ marginBottom: "1rem" }}>
        {destination.popular && <Badge variant="primary">Popular</Badge>}
        {destination.featured && <Badge variant="info">Featured</Badge>}
        {destination.interests.map((id) => (
          <Badge key={id} variant="neutral">
            {INTEREST_LABELS[id] || id}
          </Badge>
        ))}
      </div>

      <p className="font-semibold">{destination.tagline}</p>
      <p className="text-secondary" style={{ margin: "0.5rem 0 1.5rem" }}>
        {destination.description}
      </p>

      <dl className="info-list">
        <Row label="Province">{destination.province}</Row>
        <Row label="Best season">{destination.bestSeason}</Row>
        <Row label="Altitude">about {destination.altitudeM} m</Row>
        <Row label="Recommended stay">
          {destination.recommendedDays} {destination.recommendedDays === 1 ? "day" : "days"}
        </Row>
        <Row label="Rating">{Number(destination.rating).toFixed(1)} / 5</Row>
        <Row label="From Kathmandu">
          {access.distanceKm === 0
            ? "Starting point"
            : `${access.distanceKm} km, about ${formatTravelTime(access.hours)}`}
        </Row>
        <Row label="How to get there">{access.mode || "—"}</Row>
        <Row label="Attractions">{counts.attractions}</Row>
        <Row label="Activities">{counts.activities}</Row>
      </dl>

      <h3 className="whatif__group-title" style={{ marginTop: "1.5rem" }}>
        Estimated cost per person per day
      </h3>
      <div className="table-wrapper">
        <table className="table compare-table">
          <caption className="sr-only">Estimated daily cost per person by budget level, in Nepali rupees</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              {COST_FIELDS.map((field) => (
                <th key={field.key} scope="col">
                  {field.label}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {BUDGET_TIERS.map((tier) => {
              const costs = destination.costPerDay?.[tier] || {};
              const total = COST_FIELDS.reduce((sum, field) => sum + (costs[field.key] || 0), 0);

              return (
                <tr key={tier}>
                  <th scope="row">{TIER_LABELS[tier]}</th>
                  {COST_FIELDS.map((field) => (
                    <td key={field.key}>{formatCurrency(costs[field.key] || 0)}</td>
                  ))}
                  <td className="font-bold">{formatCurrency(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}