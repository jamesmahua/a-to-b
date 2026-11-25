/**
 * suburbs/{suburbId}
 * Customers pick their suburb from this list (no GPS in v1). Stores list the suburbs they deliver to.
 * Doc ids are slugs, e.g. "benoni-central".
 */
export interface Suburb {
  id: string
  name: string
  /** e.g. "East Rand" */
  region: string
  active: boolean
  sort: number
}

/** A delivery address as typed by the customer. No coordinates in v1. */
export interface Address {
  line1: string
  line2: string | null
  suburbId: string
  /** Copied from the suburb so it shows without an extra read. */
  suburbName: string
}
