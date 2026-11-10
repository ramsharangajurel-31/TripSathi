import { FiInfo } from "react-icons/fi";

import Card from "../ui/Card";
import WeatherCard from "./WeatherCard";
import { WEATHER_DISCLAIMER, getTripWeather } from "../../data/weatherSamples";

/**
 * Weather section of the results page: one sample card per destination, for
 * the month the traveller arrives there, under a notice that the data is
 * sample information and not a forecast.
 */
export default function WeatherSection({ trip }) {
  const cards = getTripWeather(trip);

  if (cards.length === 0) return null;

  return (
    <Card title="Weather outlook" headingLevel="h2">
      <div className="alert alert--info" role="note" style={{ marginBottom: "1.5rem" }}>
        <FiInfo className="alert__icon" size={18} aria-hidden="true" />
        <span>
          {WEATHER_DISCLAIMER} Each card describes the month you arrive at that
          destination.
        </span>
      </div>

      <ul className="weather-grid">
        {cards.map((card) => (
          <li key={`${card.destinationId}-${card.startDate}`}>
            <WeatherCard weather={card} />
          </li>
        ))}
      </ul>
    </Card>
  );
}