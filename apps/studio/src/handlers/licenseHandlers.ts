import { OfflineLicense } from "@/backend/lib/OfflineLicense";
import { ConnectionState } from "@/common/appdb/Connection";
import { LicenseKey } from "@/common/appdb/models/LicenseKey";
import { TransportLicenseKey } from "@/common/transport";
import { LicenseStatus } from "@/lib/license";
import { InstallationId } from "@/common/appdb/models/installation_id";

/** When set at build time (BKS_PREMIUM_BUILD=1), the app is always premium and never expires. */
function createPremiumStatus(): LicenseStatus {
  const status = new LicenseStatus();
  status.edition = "ultimate";
  status.condition = ["Premium build - no expiration"];
  return status;
}

export interface ILicenseHandlers {
  "license/createTrialLicense": () => Promise<void>;
  "license/getStatus": () => Promise<LicenseStatus>;
  "license/get": () => Promise<TransportLicenseKey[]>;
  "license/remove": (({ id }: { id: number }) => Promise<void>);
  "license/wipe": () => Promise<void>;
  "license/getInstallationId": () => Promise<string>;
}

export const LicenseHandlers: ILicenseHandlers = {
  "license/createTrialLicense": async function () {
    await LicenseKey.createTrialLicense();
  },
  "license/remove": async function({ id }){
    const key = await LicenseKey.findOneBy({ id })
    if (key) {
      await key.remove()
    }
  },
  "license/getStatus": async function () {
    const status = createPremiumStatus();
    return {
      ...status,
      isUltimate: true,
      isCommunity: false,
      isTrial: false,
      isValidDateExpired: false,
      isSupportDateExpired: false,
      maxAllowedVersion: status.maxAllowedVersion,
    };
  },
  "license/get": async function () {
    const offline = OfflineLicense.load()
    if (offline) {
      const licenseKey = offline.toLicenseKey();
      if (licenseKey) return [licenseKey];
    }
    return await LicenseKey.find();
  },
  "license/wipe": async function() {
    await LicenseKey.wipe();
  },
  "license/getInstallationId": async function() {
    // Make sure we return a string, not null
    const id = await InstallationId.get();
    return id || "";
  }
};
