"use client";

import { useTranslations } from "next-intl";

import type { ImeiVerificationResult } from "../schemas/imei.schema";

interface ImeiVerificationResultProps {
  verification: ImeiVerificationResult;
  showPakistanSignals?: boolean;
}

export function ImeiVerificationResultCard({
  verification,
  showPakistanSignals = true,
}: ImeiVerificationResultProps) {
  const t = useTranslations("imei.result");

  const statusColor = (status: string | null) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isHighRisk = verification.isStolen || verification.isBlacklisted;
  const isLowRisk =
    showPakistanSignals &&
    (verification.ptaStatus === "APPROVED" || verification.cpidStatus === "APPROVED");
  const risk = isHighRisk
    ? { level: t("highRisk"), className: "text-red-600 bg-red-50" }
    : isLowRisk
      ? { level: t("lowRisk"), className: "text-green-600 bg-green-50" }
      : { level: t("unknownRisk"), className: "text-yellow-600 bg-yellow-50" };

  return (
    <div className="bg-card rounded-lg border p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-muted-foreground font-mono text-sm">{verification.imei}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${risk.className}`}>
          {verification.isSimulated ? t("simulated") : `${t("risk")}: ${risk.level}`}
        </span>
      </div>

      {verification.isSimulated ? (
        <p role="note" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>{t("simulatedTitle")}</strong> {t("simulatedBody")}
        </p>
      ) : null}
      {verification.isStale ? (
        <p role="note" className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900">
          {t("stale")}
        </p>
      ) : null}

      <div className="space-y-4">
        {showPakistanSignals ? (
          <>
            <StatusRow
              title={t("ptaStatus")}
              subtitle={t("ptaAuthority")}
              status={verification.ptaStatus}
              statusColor={statusColor(verification.ptaStatus)}
            />
            <StatusRow
              title={t("cpidStatus")}
              subtitle={t("cpidAuthority")}
              status={verification.cpidStatus}
              statusColor={statusColor(verification.cpidStatus)}
            />
          </>
        ) : null}

        <div className="space-y-2">
          <CheckRow label={t("stolenCheck")} flagged={verification.isStolen} flaggedLabel={t("flagged")} clearLabel={t("clear")} />
          <CheckRow label={t("blacklistCheck")} flagged={verification.isBlacklisted} flaggedLabel={t("flagged")} clearLabel={t("clear")} />
        </div>

        {(verification.deviceModel || verification.deviceBrand || verification.deviceColor) && (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">{t("deviceInfo")}</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {verification.deviceBrand ? (
                <p><span className="text-muted-foreground">{t("brand")}:</span> {verification.deviceBrand}</p>
              ) : null}
              {verification.deviceModel ? (
                <p><span className="text-muted-foreground">{t("model")}:</span> {verification.deviceModel}</p>
              ) : null}
              {verification.deviceColor ? (
                <p><span className="text-muted-foreground">{t("color")}:</span> {verification.deviceColor}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="text-muted-foreground border-t pt-3 text-xs">
          {verification.verifiedAt ? (
            <p>
              {verification.isSimulated ? t("simulatedAt") : t("lastVerified")}: {" "}
              {new Date(verification.verifiedAt).toLocaleString()}
            </p>
          ) : null}
          {verification.verificationSource ? (
            <p>
              {t("source")}: {" "}
              {verification.verificationSource === "SIMULATED"
                ? t("simulatedSource")
                : verification.verificationSource}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  title,
  subtitle,
  status,
  statusColor,
}: {
  title: string;
  subtitle: string;
  status: string | null;
  statusColor: string;
}) {
  return (
    <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>
      {status ? (
        <span className={`rounded px-2 py-1 text-xs font-medium ${statusColor}`}>{status}</span>
      ) : null}
    </div>
  );
}

function CheckRow({
  label,
  flagged,
  flaggedLabel,
  clearLabel,
}: {
  label: string;
  flagged: boolean;
  flaggedLabel: string;
  clearLabel: string;
}) {
  return (
    <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
      <span className="text-sm">{label}</span>
      <span className={`text-sm font-medium ${flagged ? "text-red-600" : "text-green-600"}`}>
        {flagged ? `⚠️ ${flaggedLabel}` : `✓ ${clearLabel}`}
      </span>
    </div>
  );
}
