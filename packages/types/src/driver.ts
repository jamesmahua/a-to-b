import type { TimestampLike } from './common'

/** Has K&K approved this driver? Only super admin moves past `in_review`. */
export const DRIVER_APPROVALS = ['applied', 'in_review', 'approved', 'rejected', 'suspended'] as const
export type DriverApproval = (typeof DRIVER_APPROVALS)[number]

/** Spec §10.2: two paths, split by "Which document do you have?" */
export const VERIFICATION_PATHS = ['sa_id', 'passport_permit'] as const
export type VerificationPath = (typeof VERIFICATION_PATHS)[number]

export const VERIFICATION_PATH_LABELS: Record<VerificationPath, string> = {
  sa_id: 'South African ID',
  passport_permit: 'Passport / Permit holder',
}

/** Follow-up question on path B, to route to the right verification product. */
export const PERMIT_TYPES = ['work_permit', 'asylum_seeker', 'refugee', 'permanent_residence', 'other'] as const
export type PermitType = (typeof PERMIT_TYPES)[number]

export type VerificationStatus = 'not_started' | 'pending' | 'passed' | 'failed'

/**
 * The result of the ID check only. ID and passport numbers are NOT stored (POPIA):
 * the verification provider holds them; we keep their reference.
 */
export interface DriverVerification {
  status: VerificationStatus
  /** e.g. "verifynow", "dots_africa" */
  provider: string | null
  reference: string | null
  checkedAt: TimestampLike | null
}

export const VEHICLE_TYPES = ['motorbike', 'car', 'scooter', 'bicycle'] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const DRIVER_AVAILABILITY = ['offline', 'available', 'on_delivery'] as const
export type DriverAvailability = (typeof DRIVER_AVAILABILITY)[number]

/**
 * drivers/{uid}
 * Same id as the driver's users/{uid} doc.
 */
export interface Driver {
  uid: string
  displayName: string
  firstName: string
  phone: string
  verificationPath: VerificationPath
  permitType: PermitType | null
  verification: DriverVerification
  approval: DriverApproval
  /** Why an application was declined, shown to the driver. */
  approvalNote: string | null
  availability: DriverAvailability
  vehicle: { type: VehicleType; registration: string | null }
  /** Suburbs the driver is willing to work in. */
  operatingSuburbIds: string[]
  /** The order they're on right now, if any. */
  activeOrderId: string | null
  createdAt: TimestampLike
  updatedAt: TimestampLike
}
