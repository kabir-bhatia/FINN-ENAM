// iPhone home-screen icon (180 px).
import { appIcon } from "@/lib/appicon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
