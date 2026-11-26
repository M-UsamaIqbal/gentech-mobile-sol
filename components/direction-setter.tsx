"use client";

import * as React from "react";

export function DirectionSetter({ locale, isRtl }: { locale: string; isRtl: boolean }) {
  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [locale, isRtl]);

  return null;
}