import HeroSection from "../components/home/HeroSection";
import PopularDestinations from "../components/home/PopularDestinations";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import HowItWorks from "../components/home/HowItWorks";
import WhyTripSathi from "../components/home/WhyTripSathi";
import Button from "../components/ui/Button";

/**
 * Landing page. Section order (backgrounds alternate white / grey):
 *   Hero → Popular destinations → Featured destinations →
 *   How it works → Why TripSathi → Call to action
 *
 * Each section owns its content and reads its data from data/destinations.js,
 * so this file only composes them.
 */
function CallToAction() {
  return (
    <section className="section" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta-band">
          <h2 id="cta-title" className="cta-band__title">
            Ready to plan your Nepal trip?
          </h2>
          <p className="cta-band__text">
            Create an account to build, compare and save itineraries that fit
            your budget and your days.
          </p>
          <div className="cta-band__actions">
            <Button to="/register" variant="light" size="lg">
              Create an account
            </Button>
            <Button to="/login" variant="outline-light" size="lg">
              Log in
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <PopularDestinations />
      <FeaturedDestinations />
      <HowItWorks />
      <WhyTripSathi />
      <CallToAction />
    </>
  );
}