export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import { ImeiVerificationResultCard } from '@/features/phone-intelligence/components/imei-verification-result';
import { verifyImeiAction, getImeiVerificationAction } from '@/features/phone-intelligence/actions/imei.actions';

export const metadata: Metadata = {
  title: 'IMEI Verification - GenTech',
  description: 'Check PTA registration status and verify IMEI for any mobile phone. Ensure your device is compliant and not blacklisted.',
  robots: {
    index: true,
    follow: true,
  },
};

type ImeiCheckSearchParams = {
  imei?: string;
  unavailable?: string;
  rateLimited?: string;
  invalid?: string;
};

export default async function ImeiCheckPage({
  searchParams,
}: {
  searchParams?: Promise<ImeiCheckSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { imei, unavailable, rateLimited, invalid } = resolvedSearchParams;

  let verification = null;
  if (imei && /^\d{15}$/.test(imei)) {
    verification = await getImeiVerificationAction(imei);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IMEI Verification</h1>
        <p className="text-gray-600">
          Check PTA registration status and verify your device is not blacklisted
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {invalid && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            Enter a valid 15-digit IMEI. Dial *#06# on the phone to find it.
          </div>
        )}
        {rateLimited && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
          >
            Too many IMEI checks. Wait a minute before trying again.
          </div>
        )}
        {unavailable && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700"
          >
            PTA/CPID verification is not available in this environment, so no status was
            produced. Do not treat an absent result as proof that the device is registered
            or clean.
          </div>
        )}

        {/* IMEI Check Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enter IMEI Number</h2>
          <form action={verifyImeiAction} className="space-y-4">
            <div>
              <label htmlFor="imei" className="block text-sm font-medium text-gray-700 mb-1">
                IMEI Number (15 digits)
              </label>
              <input
                type="text"
                id="imei"
                name="imei"
                required
                pattern="\d{15}"
                maxLength={15}
                placeholder="e.g., 123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dial *#06# on your phone to find your IMEI
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Verify IMEI
            </button>
          </form>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What is IMEI?</h3>
            <p className="text-sm text-blue-800">
              IMEI (International Mobile Equipment Identity) is a unique 15-digit number that
              identifies your mobile device. It&apos;s used for device registration and security.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">PTA Registration</h3>
            <p className="text-sm text-green-800">
              In Pakistan, all mobile devices must be registered with PTA (Pakistan
              Telecommunication Authority) to operate on local networks legally.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">CPID Status</h3>
            <p className="text-sm text-yellow-800">
              CPID (Compliant Device Identification) is a system to track imported devices
              and ensure they meet regulatory requirements.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Blacklist Check</h3>
            <p className="text-sm text-red-800">
              We check if the device has been reported stolen or blacklisted by carriers.
              Avoid buying blacklisted devices as they may be blocked from networks.
            </p>
          </div>
        </div>

        {/* Verification Result */}
        {verification && (
          <ImeiVerificationResultCard verification={verification} />
        )}
      </div>
    </div>
  );
}
