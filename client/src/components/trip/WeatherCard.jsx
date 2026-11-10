import { FiCloudRain, FiMapPin } from "react-icons/fi";

import Badge from "../ui/Badge";
import { formatDateRange } from "../../utils/formatDate";

/**
 * One destination's sample weather. Every card carries a "Sample data"
 * badge and a dashed border, so it can never be mistaken for a live
 * forecast.
 *
 * Props
 *  weather  one item from getTripWeather(trip) in data/weatherSamples.js
 */
export default function WeatherCard({ weather }) {
  const { name, startDate, endDate, month, minC, maxC, summary, rain, advice, altitudeM } =
    weather;

  return (
    <article className="weather-card">
      <header className="weather-card__header">
        <div>
          <h3 className="weather-card__name">{name}</h3>
          <p className="weather-card__dates">{formatDateRange(startDate, endDate)}</p>
        </div>
        <Badge variant="info">Sample data</Badge>
      </header>

      <p className="weather-card__temp">
        {minC}°C to {maxC}°C
        <span className="weather-card__temp-note">Typical for {month}</span>
      </p>

      <p className="weather-card__summary">{summary}</p>
      <p className="weather-card__advice">{advice}</p>

      <div className="weather-card__footer">
        <Badge variant={rain === "High" ? "warning" : "neutral"} icon={<FiCloudRain size={12} />}>
          Rain: {rain}
        </Badge>
        <Badge variant="neutral" icon={<FiMapPin size={12} />}>
          Altitude about {altitudeM} m
        </Badge>
      </div>
    </article>
  );
}