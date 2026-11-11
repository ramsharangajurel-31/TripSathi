import { FiInfo } from "react-icons/fi";

import { ADMIN_DATA_NOTICE } from "../../data/adminData";

/** The "demonstration data" notice shown at the top of every admin page. */
export default function AdminNotice() {
  return (
    <div className="alert alert--info admin-notice" role="note">
      <FiInfo className="alert__icon" size={18} aria-hidden="true" />
      <span>{ADMIN_DATA_NOTICE}</span>
    </div>
  );
}