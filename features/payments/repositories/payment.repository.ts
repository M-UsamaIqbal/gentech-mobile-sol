import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { PaymentStatus } from "../types";

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string;
  country: string;
  currency: string;
  amount: number;
  status: PaymentStatus;
  providerReference: string | null;
  providerTransactionId: string | null;
  idempotencyKey: string | null;
  failureReason: string | null;
  verifiedAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

const paymentSelect = {
  id: true,
  orderId: true,
  provider: true,
  country: true,
  currency: true,
  amount: true,
  status: true,
  providerReference: true,
  providerTransactionId: true,
  idempotencyKey: true,
  failureReason: true,
  verifiedAt: true,
  refundedAt: true,
  refundAmount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

export async function createPayment(input: {
  orderId: string;
  provider: string;
  country: string;
  currency: string;
  amount: number;
  idempotencyKey?: string;
}): Promise<PaymentRecord | null> {
  try {
    const payment = await prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        country: input.country,
        currency: input.currency,
        amount: new Prisma.Decimal(input.amount),
        status: "PENDING",
        idempotencyKey: input.idempotencyKey,
      },
      select: paymentSelect,
    });

    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      country: payment.country,
      currency: payment.currency,
      amount: Number(payment.amount),
      status: payment.status as PaymentStatus,
      providerReference: payment.providerReference,
      providerTransactionId: payment.providerTransactionId,
      idempotencyKey: payment.idempotencyKey,
      failureReason: payment.failureReason,
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      refundedAt: payment.refundedAt?.toISOString() ?? null,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function findPaymentById(id: string): Promise<PaymentRecord | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: paymentSelect,
    });
    if (!payment) return null;
    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      country: payment.country,
      currency: payment.currency,
      amount: Number(payment.amount),
      status: payment.status as PaymentStatus,
      providerReference: payment.providerReference,
      providerTransactionId: payment.providerTransactionId,
      idempotencyKey: payment.idempotencyKey,
      failureReason: payment.failureReason,
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      refundedAt: payment.refundedAt?.toISOString() ?? null,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function findPaymentByOrderId(orderId: string): Promise<PaymentRecord | null> {
  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      select: paymentSelect,
    });
    if (!payment) return null;
    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      country: payment.country,
      currency: payment.currency,
      amount: Number(payment.amount),
      status: payment.status as PaymentStatus,
      providerReference: payment.providerReference,
      providerTransactionId: payment.providerTransactionId,
      idempotencyKey: payment.idempotencyKey,
      failureReason: payment.failureReason,
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      refundedAt: payment.refundedAt?.toISOString() ?? null,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  data?: {
    providerTransactionId?: string;
    failureReason?: string;
    verifiedAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    refundReason?: string;
  },
): Promise<boolean> {
  try {
    await prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(data?.providerTransactionId && { providerTransactionId: data.providerTransactionId }),
        ...(data?.failureReason && { failureReason: data.failureReason }),
        ...(data?.verifiedAt && { verifiedAt: data.verifiedAt }),
        ...(data?.refundedAt && { refundedAt: data.refundedAt }),
        ...(data?.refundAmount && { refundAmount: new Prisma.Decimal(data.refundAmount) }),
        ...(data?.refundReason && { refundReason: data.refundReason }),
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function findPaymentByIdempotencyKey(key: string): Promise<PaymentRecord | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { idempotencyKey: key },
      select: paymentSelect,
    });
    if (!payment) return null;
    return {
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      country: payment.country,
      currency: payment.currency,
      amount: Number(payment.amount),
      status: payment.status as PaymentStatus,
      providerReference: payment.providerReference,
      providerTransactionId: payment.providerTransactionId,
      idempotencyKey: payment.idempotencyKey,
      failureReason: payment.failureReason,
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      refundedAt: payment.refundedAt?.toISOString() ?? null,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}