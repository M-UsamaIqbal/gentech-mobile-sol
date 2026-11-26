export type {
  DealerLeadDto,
  CreateDealerLeadInput,
  UpdateDealerLeadInput,
  DealerDto,
  DealerBranchDto,
  DealerInventoryDto,
  DealerUserDto,
  CreateBranchInput,
  CreateDealerInput,
  UpdateDealerInput,
  BulkImportDealerInventoryInput,
} from "./types";

export {
  createDealer,
  getDealerById,
  getDealerBySlug,
  getDealerByUserId,
  getDealerMembershipByUserId,
  updateDealer,
  getDealerReviewQueue,
  getDealerStatusCounts,
  reviewDealerApplication,
  listActiveDealers,
  createBranch,
  getBranchesByDealer,
  setDealerBranchActive,
  removeDealerInventory,
} from "./repositories/dealer.repository";

export {
  convertLeadToDealer,
} from "./services/dealer.service";