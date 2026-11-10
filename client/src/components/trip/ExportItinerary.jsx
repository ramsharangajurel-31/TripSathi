import { FiPrinter } from "react-icons/fi";

import Button from "../ui/Button";
import useAuth from "../../hooks/useAuth";
import { ESTIMATE_DISCLAIMER } from "../../data/destinations";
import { formatDate, todayISO } from "../../utils/formatDate";

/**
 * Block shown only on paper (and in the saved PDF): brand, trip title,
 * who it was prepared for, the print date and the estimates notice.
 * On screen it is hidden by the .print-only rule in global.css.
 */
export function PrintHeader({ trip }) {
  const { user } = useAuth();

  return (
    <div className="print-only print-header">
      <p className="print-header__brand">
        TripSathi <span>Your Intelligent Travel Companion</span>
      </p>
      <p className="print-header__title">{trip.title}</p>
      <p className="print-header__meta">
        {user ? `Prepared for ${user.fullName} · ` : ""}
        Printed on {formatDate(todayISO())}
      </p>
      <p className="print-header__note">
        {ESTIMATE_DISCLAIMER} Weather and alternatives are sample information.
      </p>
    </div>
  );
}

/**
 * "Print / Save as PDF" button. It opens the browser's print dialog; choose
 * "Save as PDF" as the destination to get a file. Nothing is uploaded: the
 * PDF is made by the browser on the user's device.
 *
 * While the dialog is open the tab title is set to "TripSathi - <trip>", so
 * browsers suggest a meaningful file name. It is restored afterwards.
 */
export default function ExportItinerary({ trip }) {
  const handlePrint = () => {
    const previousTitle = document.title;
    document.title = `TripSathi - ${trip.title}`;

    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
  };

  return (
    <Button variant="secondary" leftIcon={<FiPrinter />} onClick={handlePrint}>
      Print / Save as PDF
    </Button>
  );
}