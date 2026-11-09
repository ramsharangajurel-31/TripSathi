import { FiCoffee, FiHome, FiMapPin, FiTruck } from "react-icons/fi";

import ActivityCard from "./ActivityCard";
import EmptyState from "../common/EmptyState";
import { ACTIVITY_SLOTS } from "../../data/activities";
import { getDestinationById } from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";
import { addDays, formatWeekdayDate } from "../../utils/formatDate";
import { MISC_RATE, getDayCosts, getPayingUnits } from "../../utils/tripUtils";

function Logistic({ icon, title, children, cost }) {
  return (
    <div className="logistic">
      <dt className="logistic__title">
        <span aria-hidden="true">{icon}</span>
        {title}
      </dt>
      <dd className="logistic__body">
        {children}
        {cost && <span className="logistic__cost">{cost}</span>}
      </dd>
    </div>
  );
}

function DayCard({ trip, day, units, renderActivityActions, renderSlotFooter }) {
  const date = addDays(trip.departureDate, day.dayNumber - 1);
  const destination = getDestinationById(day.destinationId);
  const costs = getDayCosts(trip, day);
  const titleId = `day-title-${day.id}`;

  return (
    <article className="day" aria-labelledby={titleId}>
      <header className="day__header">
        <div className="day__heading">
          <h3 id={titleId} className="day__title">
            Day {day.dayNumber}: {day.title}
          </h3>
          <p className="day__meta">
            <time dateTime={date}>{formatWeekdayDate(date)}</time>
            <span aria-hidden="true">·</span>
            <span className="day__place">
              <FiMapPin size={14} aria-hidden="true" />
              {destination ? destination.name : "—"}
            </span>
          </p>
        </div>

        <div className="day__total">
          <span className="day__total-value">{formatCurrency(costs.total)}</span>
          <span className="day__total-label">estimated for the day</span>
        </div>
      </header>

      <div className="day__slots">
        {ACTIVITY_SLOTS.map((slot) => {
          const items = day.slots?.[slot.id] || [];
          const slotId = `slot-${day.id}-${slot.id}`;

          return (
            <section key={slot.id} className="slot" aria-labelledby={slotId}>
              <h4 id={slotId} className="slot__title">
                {slot.label}
              </h4>

              <div className="slot__body">
                {items.length > 0 ? (
                  <ul className="slot__list">
                    {items.map((item) => (
                      <li key={item.id}>
                        <ActivityCard
                          item={item}
                          units={units}
                          actions={
                            renderActivityActions
                              ? renderActivityActions(item, day, slot.id)
                              : null
                          }
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="slot__empty">Free time</p>
                )}

                {renderSlotFooter && renderSlotFooter(day, slot.id)}
              </div>
            </section>
          );
        })}
      </div>

      <dl className="day__logistics">
        <Logistic
          icon={<FiTruck />}
          title="Transport"
          cost={`${formatCurrency(day.transport?.costPerPerson || 0)} per person`}
        >
          {day.transport?.label || "Local transport"}
        </Logistic>

        <Logistic
          icon={<FiHome />}
          title="Accommodation"
          cost={
            day.accommodation
              ? `${formatCurrency(day.accommodation.costPerPerson)} per person`
              : undefined
          }
        >
          {day.accommodation ? day.accommodation.label : "No overnight stay"}
        </Logistic>

        <Logistic
          icon={<FiCoffee />}
          title="Food"
          cost={`${formatCurrency(day.food?.costPerPerson || 0)} per person`}
        >
          {day.food?.label || "Local restaurants"}
        </Logistic>
      </dl>

      {day.notes && <p className="day__notes">{day.notes}</p>}
    </article>
  );
}

/**
 * Day-by-day itinerary: for every day, its date, location, morning,
 * afternoon and evening activities, estimated costs, transport,
 * accommodation and food.
 *
 * Props
 *  trip                    trip object
 *  renderActivityActions   optional function(item, day, slotId) returning
 *                          buttons for each activity (the editor, Step 7)
 *  renderSlotFooter        optional function(day, slotId) returning content
 *                          under a time slot (the editor's "Add activity")
 */
export default function ItineraryTimeline({
  trip,
  renderActivityActions,
  renderSlotFooter,
}) {
  const days = Array.isArray(trip.days) ? trip.days : [];
  const units = getPayingUnits(trip);

  return (
    <section aria-labelledby="itinerary-title">
      <h2 id="itinerary-title" className="results-title">
        Daily itinerary
      </h2>
      <p className="results-note">
        Amounts are estimates for your whole group, rounded, and exclude the{" "}
        {Math.round(MISC_RATE * 100)}% miscellaneous buffer.
      </p>

      {days.length === 0 ? (
        <EmptyState
          title="No days planned"
          message="This trip has no itinerary days yet."
        />
      ) : (
        <ol className="timeline">
          {days.map((day) => (
            <li key={day.id} className="timeline__item">
              <span className="timeline__marker" aria-hidden="true">
                {day.dayNumber}
              </span>
              <DayCard
                trip={trip}
                day={day}
                units={units}
                renderActivityActions={renderActivityActions}
                renderSlotFooter={renderSlotFooter}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}