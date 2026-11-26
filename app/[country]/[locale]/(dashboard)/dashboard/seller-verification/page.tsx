import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import type { CountryCode } from "@/lib/countries/types";
import { getCurrentUser } from "@/lib/session";
import { getSellerVerification } from "@/features/seller-verification/services/seller-verification.service";

export default async function SellerVerificationPage({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}) {
  const { country } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const countryCode: CountryCode = country.toUpperCase() === "BH" ? "BH" : "PK";
  const verification = await getSellerVerification(user.id, countryCode);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Seller Verification</h1>
      <p className="mt-2 text-muted-foreground">
        Submit your documents for verification in {country.toUpperCase() === "BH" ? "Bahrain" : "Pakistan"}.
      </p>

      {verification ? (
        <div className="mt-6 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Verification Status</h2>
          <p className="mt-2">
            Status:{" "}
            <span
              className={
                verification.status === "APPROVED"
                  ? "text-green-500"
                  : verification.status === "REJECTED"
                    ? "text-red-500"
                    : "text-yellow-500"
              }
            >
              {verification.status}
            </span>
          </p>
          {verification.notes ? (
            <p className="mt-2 text-sm text-muted-foreground">Notes: {verification.notes}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Submitted: {new Date(verification.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border p-4">
          <p className="text-muted-foreground">No verification submitted yet.</p>
        </div>
      )}

      <form className="mt-6 space-y-4" action="/api/seller-verification/submit" method="POST">
        <input type="hidden" name="country" value={country.toUpperCase()} />
        <div>
          <label className="block text-sm font-medium">Business Name</label>
          <input
            type="text"
            name="businessName"
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tax Number (optional)</label>
          <input
            type="text"
            name="taxNumber"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Document URLs (comma-separated)</label>
          <textarea
            name="documents"
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="https://example.com/doc1.pdf, https://example.com/doc2.pdf"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Submit Verification
        </button>
      </form>
    </div>
  );
}