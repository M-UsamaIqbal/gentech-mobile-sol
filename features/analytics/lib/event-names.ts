/** Canonical analytics event names shared by the facade and typed helpers. */
export const ANALYTICS_EVENTS = {
  SEARCH: "search",
  VIEW_LISTING: "view_listing",
  START_CHAT: "start_chat",
  CREATE_LISTING: "create_listing",
  SAVE_SEARCH: "save_search",
  TOGGLE_FAVORITE: "toggle_favorite",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Meta standard event names for the matching custom events. */
export const META_STANDARD_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  [ANALYTICS_EVENTS.BEGIN_CHECKOUT]: "InitiateCheckout",
  [ANALYTICS_EVENTS.PURCHASE]: "Purchase",
  [ANALYTICS_EVENTS.START_CHAT]: "Contact",
};
