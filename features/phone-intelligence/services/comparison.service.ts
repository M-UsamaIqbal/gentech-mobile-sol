import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import type { Region } from '@/lib/generated/prisma/enums';
import type { ListingCardData } from '@/types/marketplace';
import { getSelectedListingCards } from '@/features/listings/services/listing.service';
import { phoneModelRepository, type PhoneModelWithBrand } from '../repositories/phone-model.repository';
import { resolvePhoneModelForListing } from './listing-model-resolver';
import type { PhoneComparisonInput, PhoneSpecComparison } from '../schemas/comparison.schema';

function fromPhoneModel(phone: PhoneModelWithBrand): PhoneSpecComparison {
  return {
    id: phone.id,
    name: phone.name,
    brand: phone.brand.name,
    slug: phone.slug,
    imageUrl: phone.imageUrl ?? undefined,
    displaySize: phone.displaySize,
    displayResolution: phone.displayResolution,
    displayType: phone.displayType,
    refreshRate: phone.refreshRate,
    processor: phone.processor,
    cpuCores: phone.cpuCores,
    gpu: phone.gpu,
    ramOptions: phone.ramOptions,
    storageOptions: phone.storageOptions,
    mainCamera: phone.mainCamera,
    selfieCamera: phone.selfieCamera,
    cameraFeatures: phone.cameraFeatures,
    batteryCapacity: phone.batteryCapacity,
    batteryType: phone.batteryType,
    chargingSpeed: phone.chargingSpeed,
    networkSupport: phone.networkSupport,
    simType: phone.simType,
    wifi: phone.wifi,
    bluetooth: phone.bluetooth,
    nfc: phone.nfc,
    weight: phone.weight,
    dimensions: phone.dimensions,
    os: phone.os,
    osVersion: phone.osVersion,
    features: phone.features,
    colors: phone.colors,
    launchPrice: phone.launchPrice ? Number(phone.launchPrice) : null,
    releaseDate: phone.releaseDate,
  };
}

function fromListing(listing: ListingCardData): PhoneSpecComparison {
  return {
    id: listing.id,
    name: listing.model ?? listing.title,
    brand: listing.brand ?? 'Unknown',
    slug: listing.slug,
    imageUrl: listing.imageUrl,
    displaySize: null,
    displayResolution: null,
    displayType: null,
    refreshRate: null,
    processor: null,
    cpuCores: null,
    gpu: null,
    ramOptions: listing.ram ? [listing.ram] : [],
    storageOptions: listing.storage ? [listing.storage] : [],
    mainCamera: null,
    selfieCamera: null,
    cameraFeatures: [],
    batteryCapacity: listing.batteryHealth ? `${listing.batteryHealth}% health` : null,
    batteryType: null,
    chargingSpeed: null,
    networkSupport: [],
    simType: null,
    wifi: null,
    bluetooth: null,
    nfc: null,
    weight: null,
    dimensions: null,
    os: null,
    osVersion: null,
    features: listing.warranty ? [listing.warranty] : [],
    colors: listing.color ? [listing.color] : [],
    launchPrice: null,
    releaseDate: null,
  };
}

export class ComparisonService {
  /**
   * Create a comparison session
   */
  async createComparison(
    input: PhoneComparisonInput,
    userId?: string,
    sessionId?: string
  ) {
    const phones = await phoneModelRepository.findByIds(input.phoneIds);

    if (phones.length < 2) {
      throw new Error('At least 2 phones must be compared');
    }

    const comparison = await prisma.phoneComparison.create({
      data: {
        userId,
        phoneIds: input.phoneIds,
        phoneSpecs: phones as unknown as Prisma.InputJsonValue,
        isAnonymous: !userId,
        sessionId,
      },
    });

    return comparison;
  }

  /**
   * Get comparison by ID
   */
  async getComparison(id: string) {
    return prisma.phoneComparison.findUnique({
      where: { id },
    });
  }

  /**
   * Get comparison specs for display
   */
  async getComparisonSpecs(phoneIds: string[]): Promise<PhoneSpecComparison[]> {
    const phones = await phoneModelRepository.findByIds(phoneIds);
    return phones.map(fromPhoneModel);
  }

  /**
   * Resolves marketplace listings to catalog models when possible. Unmatched listings
   * still compare using their own attributes, so no selection silently disappears.
   */
  async getListingComparisonSpecs(
    listingIds: string[],
    region?: Region,
  ): Promise<PhoneSpecComparison[]> {
    const ids = [...new Set(listingIds.filter(Boolean))].slice(0, 4);
    if (ids.length === 0) return [];

    // The selected ids are resolved through the marketplace's own listing service.
    // Catalog enrichment is independent: an unavailable catalog must never discard
    // listings that were loaded successfully.
    let listings: ListingCardData[] = [];
    try {
      listings = await getSelectedListingCards(ids, region);
    } catch (error) {
      console.warn(
        "[compare] Could not load selected listings.",
        error instanceof Error ? error.message : error,
      );
    }

    let models: PhoneModelWithBrand[] = [];
    try {
      models = await phoneModelRepository.findAllActive();
    } catch (error) {
      console.warn(
        "[compare] Catalog specs unavailable; using listing attributes.",
        error instanceof Error ? error.message : error,
      );
    }

    const byId = new Map(listings.map((listing) => [listing.id, listing]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((listing): listing is ListingCardData => Boolean(listing));

    const specs = ordered.map((listing) => {
      const model = resolvePhoneModelForListing(listing, models);
      const spec = model ? fromPhoneModel(model) : fromListing(listing);
      // Keep the listing as the comparison subject. A catalog match supplies
      // specifications only — replacing the id breaks refresh/removal links.
      return {
        ...spec,
        id: listing.id,
        slug: listing.slug,
        name: listing.model ?? listing.title,
        brand: listing.brand ?? spec.brand,
        imageUrl: listing.imageUrl ?? spec.imageUrl,
      };
    });

    return specs;
  }

  /**
   * Get user's comparison history
   */
  async getUserComparisons(userId: string) {
    return prisma.phoneComparison.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Get comparison by session ID (for anonymous users)
   */
  async getComparisonBySession(sessionId: string) {
    return prisma.phoneComparison.findFirst({
      where: { sessionId },
    });
  }
}

export const comparisonService = new ComparisonService();
