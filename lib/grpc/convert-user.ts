import type { User as ProtoUser } from "@icco/etu-proto"
import type { Timestamp as ProtoTimestamp } from "@bufbuild/protobuf/wkt"
import type { Timestamp, User } from "./client"

export function convertTimestamp(ts: ProtoTimestamp): Timestamp {
  return {
    seconds: ts.seconds.toString(),
    nanos: ts.nanos,
  }
}

export function convertUser(user: ProtoUser | undefined): User {
  if (!user) {
    return { id: "", email: "", subscriptionStatus: "", hasNotionKey: false, aiEnabled: false, disabled: true }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEnd: user.subscriptionEnd ? convertTimestamp(user.subscriptionEnd) : undefined,
    createdAt: user.createdAt ? convertTimestamp(user.createdAt) : undefined,
    updatedAt: user.updatedAt ? convertTimestamp(user.updatedAt) : undefined,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripePriceId: user.stripePriceId,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    currentPeriodStart: user.currentPeriodStart ? convertTimestamp(user.currentPeriodStart) : undefined,
    billingLine1: user.billingLine1,
    billingLine2: user.billingLine2,
    billingCity: user.billingCity,
    billingState: user.billingState,
    billingPostalCode: user.billingPostalCode,
    billingCountry: user.billingCountry,
    hasNotionKey: user.hasNotionKey,
    aiEnabled: user.aiEnabled,
    disabled: user.disabled,
    notionDatabaseName: user.notionDatabaseName,
    billingProvider: user.billingProvider,
  }
}
