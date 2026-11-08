import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiMessageSquare } from "react-icons/fi";

import Button from "../ui/Button";
import Input from "../ui/Input";

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

const EXAMPLES = [
  "4 days in Pokhara with friends, NPR 40,000, nature and photography",
  "Family trip to Chitwan for 3 days, budget NPR 60,000",
  "Weekend in Nagarkot, relaxation, under NPR 15,000",
];

/**
 * Natural-language trip box shown in the hero.
 *
 * On submit it opens the trip wizard with the typed text in the URL:
 *   /dashboard/create-trip?q=<text>
 * The wizard (Phase 4) reads `q` and pre-fills its description field.
 *
 * In this frontend phase no AI is called. The text is only passed along.
 * Visitors who are not logged in are sent to the login page first
 * (ProtectedRoute, Phase 3), which will keep this URL so they return here.
 */
export default function SearchTrip() {
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setText(event.target.value);
    if (error) setError("");
  };

  const handleExample = (example) => {
    setText(example);
    setError("");
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (trimmed.length < MIN_LENGTH) {
      setError(
        `Add a little more detail (at least ${MIN_LENGTH} characters), such as where, how long and your budget.`
      );
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    const params = new URLSearchParams({ q: trimmed });
    navigate(`/dashboard/create-trip?${params.toString()}`);
  };

  return (
    <form
      className="trip-search"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="trip-search-title"
    >
      <h2 id="trip-search-title" className="trip-search__title">
        <FiMessageSquare aria-hidden="true" />
        Describe your trip
      </h2>
      <p className="trip-search__subtitle">
        Write it the way you would tell a friend. You can adjust every detail in
        the next step.
      </p>

      <Input
        ref={textareaRef}
        as="textarea"
        rows={4}
        name="tripDescription"
        label="Your ideal trip"
        value={text}
        onChange={handleChange}
        maxLength={MAX_LENGTH}
        placeholder="e.g. 4 days in Pokhara with friends, total budget NPR 40,000, we enjoy nature and adventure."
        error={error}
        hint={`${text.length}/${MAX_LENGTH} characters`}
      />

      <div className="trip-search__examples" aria-label="Example descriptions">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="chip"
            onClick={() => handleExample(example)}
          >
            {example}
          </button>
        ))}
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        block
        rightIcon={<FiArrowRight />}
      >
        Plan my trip
      </Button>

      <p className="trip-search__note">
        Cost figures are sample estimates. No booking or payment is involved.
      </p>
    </form>
  );
}